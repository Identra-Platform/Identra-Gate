import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DatabaseStatus, HealthCheckResult, HealthStatus, ServiceStatus, SystemMetrics } from './interfaces/health.interface';
import { ConfigService } from 'src/config/config.service';
import { DataSource } from 'typeorm';
import path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

@Injectable()
export class HealthService implements OnModuleInit {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = new Date();
  private serviceDependencies: Map<string, ServiceStatus> = new Map();

  constructor(
    private configService: ConfigService,
    private dataSource: DataSource
  ) {}

  onModuleInit() {
    this.initializeHealthChecks();
  }

  private initializeHealthChecks() {
    this.serviceDependencies.set('database', {
      name: 'SQLite Database',
      responseTime: null,
      required: true,
      status: 'unknown',
      lastCheck: null,
    });

    this.serviceDependencies.set('filesystem', {
      name: 'File System',
      responseTime: null,
      required: true,
      status: 'unknown',
      lastCheck: null,
    });

    this.serviceDependencies.set('memory', {
      name: 'System Memory',
      responseTime: null,
      required: true,
      status: 'unknown',
      lastCheck: null,
    });
  }

  async checkHealth(detailed = false): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkFileSystem(),
      this.checkMemory(),
      this.checkDiskSpace(),
      this.checkExternalConnections()
    ]);

    const results = checks.map(result => result.status === 'fulfilled' ? result.value : this.handleFailedCheck(result.reason));

    const criticalFailures = results.filter(result => result.status === 'down' && result.required);

    const overrallStatus: HealthStatus = criticalFailures.length > 0 ? 'down': 'up';

    const response: HealthCheckResult = {
      status: overrallStatus,
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      environment: this.configService.server.nodeEnv,
      checks: results
    };

    if (detailed) {
      response.metrics = await this.getSystemMetrics();
      response.services = Array.from(this.serviceDependencies.values());
    }

    return response;
  }

  async checkHealthLight(): Promise<{ status: HealthStatus; timestamp: string; version: string }> {
    const databaseCheck = await this.checkDatabase();
    
    return {
      status: databaseCheck.status === 'up' ? 'up' : 'down',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  async checkDatabase(): Promise<DatabaseStatus> {
    const startTime = Date.now();
    try {
      const isConnected = this.dataSource.isInitialized;
      if (!isConnected) {
        throw new Error('Database not initialized');
      }

      await this.dataSource.query('SELECT 1');
      const queryTime = Date.now() - startTime;
      const status: DatabaseStatus = {
        name: 'SQLite Database',
        status: 'up',
        responseTime: queryTime,
        required: true,
        lastCheck: new Date().toISOString(),
        details: {
          host: this.configService.database.host,
          database: this.configService.database.database,
          connection: 'established',
          poolSize: (this.dataSource.driver as any).pool?.max || 'unknown'
        }
      };

      this.updateServiceStatus('database', 'up');
      return status;
    } catch (error) {
      const status: DatabaseStatus = {
        name: 'SQLite Database',
        status: 'down',
        responseTime: Date.now() - startTime,
        required: true,
        lastCheck: new Date().toISOString(),
        error: error.message,
        details: {
          host: this.configService.database.host,
          database: this.configService.database.database,
          connection: 'failed',
        },
      };
      
      this.updateServiceStatus('database', 'down');
      this.logger.error(`Database health check failed: ${error.message}`);
      return status;
    }
  }

  private async checkFileSystem(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      const dataDir = path.dirname(this.configService.setup.setupFlagPath);

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, {recursive: true});
      }

      const testFile = path.join(dataDir, '.health-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);

      const status: ServiceStatus = {
        name: 'File System',
        status: 'up',
        responseTime: Date.now() - startTime,
        required: true,
        lastCheck: new Date().toISOString(),
        details: {
          dataDirectory: dataDir,
          writable: true,
          freeSpace: await this.getFreeDiskSpace(dataDir),
        },
      };

      this.updateServiceStatus('filesystem', 'up');
      return status;
    } catch (error) {
      const status: ServiceStatus = {
        name: 'File System',
        status: 'down',
        responseTime: Date.now() - startTime,
        required: true,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };

      this.updateServiceStatus('filesystem', 'down');
      this.logger.error(`Filesystem health check failed: ${error.message}`);
      return status;
    }
  }

  private async checkMemory(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;


      const status: ServiceStatus = {
        name: 'System Memory',
        status: memoryUsagePercent > 90 ? 'warning' : 'up',
        responseTime: Date.now() - startTime,
        required: true,
        lastCheck: new Date().toISOString(),
        details: {
          total: this.formatBytes(totalMemory),
          free: this.formatBytes(freeMemory),
          used: this.formatBytes(usedMemory),
          usagePercent: Math.round(memoryUsagePercent * 100) / 100,
        },
      };

      this.updateServiceStatus('memory', status.status);
      if (memoryUsagePercent > 90) {
        this.logger.warn(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
      }
      return status;
    } catch (error) {
      const status: ServiceStatus = {
        name: 'System Memory',
        status: 'down',
        responseTime: Date.now() - startTime,
        required: true,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };

      this.updateServiceStatus('memory', 'down');
      return status;
    }
  }

  private async checkDiskSpace(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      const dataDir = path.dirname(this.configService.setup.setupFlagPath);
      const freeSpace = await this.getFreeDiskSpace(dataDir);
      
      const freeBytes = this.parseBytes(freeSpace);
      const warningThreshold = 1 * 1024 * 1024 * 1024;
      const criticalThreshold = 100 * 1024 * 1024;

      let status: 'up' | 'warning' | 'down' = 'up';
      
      if (freeBytes < criticalThreshold) {
        status = 'down';
      } else if (freeBytes < warningThreshold) {
        status = 'warning';
      }

      const healthStatus: ServiceStatus = {
        name: 'Disk Space',
        status,
        responseTime: Date.now() - startTime,
        required: true,
        lastCheck: new Date().toISOString(),
        details: {
          freeSpace,
          dataDirectory: dataDir,
          thresholdWarning: this.formatBytes(warningThreshold),
          thresholdCritical: this.formatBytes(criticalThreshold),
        },
      };

      if (status !== 'up') {
        this.logger[status === 'down' ? 'error' : 'warn'](
          `Low disk space: ${freeSpace} free in ${dataDir}`
        );
      }

      return healthStatus;

    } catch (error) {
      const status: ServiceStatus = {
        name: 'Disk Space',
        status: 'down',
        responseTime: Date.now() - startTime,
        required: false, // Not critical for operation
        lastCheck: new Date().toISOString(),
        error: error.message,
      };

      return status;
    }
  }

  private async checkExternalConnections(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      await execAsync('nslookup google.com');
      
      const status: ServiceStatus = {
        name: 'External Connectivity',
        status: 'up',
        responseTime: Date.now() - startTime,
        required: false,
        lastCheck: new Date().toISOString(),
        details: {
          internet: 'connected',
          dnsResolution: 'working',
        },
      };

      return status;

    } catch (error) {
      const status: ServiceStatus = {
        name: 'External Connectivity',
        status: 'down',
        responseTime: Date.now() - startTime,
        required: false,
        lastCheck: new Date().toISOString(),
        error: 'Cannot reach external networks',
        details: {
          internet: 'disconnected',
          dnsResolution: 'failed',
        },
      };

      return status;
    }
  }

  private updateServiceStatus(service: string, status: HealthStatus) {
    const existing = this.serviceDependencies.get(service);
    if (existing) {
      existing.status = status;
      existing.lastCheck = new Date().toISOString();
      this.serviceDependencies.set(service, existing);
    }
  }

  private async getFreeDiskSpace(path: string): Promise<string> {
    try {
      if (os.platform() === 'win32') {
        const { stdout } = await execAsync(`wmic logicaldisk where "DeviceID='${path.charAt(0).toUpperCase()}:'" get FreeSpace`);
        const freeBytes = parseInt(stdout.split('\n')[1].trim());
        return this.formatBytes(freeBytes);
      } else {
        const { stdout } = await execAsync(`df -k ${path} | tail -1 | awk '{print $4}'`);
        const freeKB = parseInt(stdout.trim());
        return this.formatBytes(freeKB * 1024);
      }
    } catch {
      return 'unknown';
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private parseBytes(sizeStr: string): number {
    const units = {
      'Bytes': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^([\d.]+)\s*([A-Za-z]+)$/);
    if (!match) return 0;

    const [, valueStr, unit] = match;
    const value = parseFloat(valueStr);
    const multiplier = units[unit] || 1;

    return value * multiplier;
  }

  private handleFailedCheck(error: Error): ServiceStatus {
    return {
      name: 'Unknown Check',
      status: 'down',
      responseTime: 0,
      required: false,
      lastCheck: new Date().toISOString(),
      error: error.message,
    };
  }

  private getUptime(): string {
    const uptimeMs = Date.now() - this.startTime.getTime();
    const seconds = Math.floor(uptimeMs / 1000);
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const loadAvg = os.loadavg();
    const memory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    };

    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown';
    const cpuCores = cpus.length;

    const networkInterfaces = os.networkInterfaces();
    const externalIps = Object.values(networkInterfaces)
      .flat()
      .filter(iface => iface && !iface.internal && iface.family === 'IPv4')
      .map(iface => iface?.address ?? 'unknown');

    return {
      cpu: {
        loadAverage: {
          1: loadAvg[0],
          5: loadAvg[1],
          15: loadAvg[2],
        },
        cores: cpuCores,
        model: cpuModel,
      },
      memory: {
        total: this.formatBytes(memory.total),
        free: this.formatBytes(memory.free),
        used: this.formatBytes(memory.used),
        usagePercent: Math.round((memory.used / memory.total) * 10000) / 100,
      },
      os: {
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch(),
        uptime: os.uptime(),
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: process.version,
      },
      network: {
        hostname: os.hostname(),
        externalIPs: externalIps,
      },
    };
  }
}

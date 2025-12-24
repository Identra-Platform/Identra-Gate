export type HealthStatus = 'up' | 'down' | 'warning' | 'unknown';
export type ServiceType = 'database' | 'filesystem' | 'memory' | 'network' | 'external';

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  uptime: string;
  environment: string;
  checks: ServiceStatus[];
  metrics?: SystemMetrics;
  services?: ServiceStatus[];
}

export interface ServiceStatus {
  name: string;
  status: HealthStatus;
  responseTime: number | null;
  required: boolean;
  lastCheck: string | null;
  error?: string;
  details?: Record<string, any>;
}

export interface DatabaseStatus extends ServiceStatus {
  details?: {
    host: string;
    database: string;
    connection: string;
    poolSize?: number | string;
    version?: string;
  };
}

export interface SystemMetrics {
  cpu: {
    loadAverage: {
      1: number;
      5: number;
      15: number;
    };
    cores: number;
    model: string;
  };
  memory: {
    total: string;
    free: string;
    used: string;
    usagePercent: number;
  };
  os: {
    platform: string;
    release: string;
    type: string;
    arch: string;
    uptime: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    version: string;
  };
  network: {
    hostname: string;
    externalIPs: string[];
  };
}
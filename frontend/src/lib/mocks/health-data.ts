import type { HealthResponse } from '$lib/types/api';

export const mockHealthData: HealthResponse = {
  status: 'up',
  timestamp: new Date().toISOString(),
  uptime: '7 days, 3 hours, 15 minutes',
  environment: 'production',
  checks: [
    {
      name: 'database',
      status: 'up',
      responseTime: 45,
      required: true,
      lastCheck: new Date().toISOString(),
      error: null,
      details: {
        host: 'localhost',
        database: 'verifier_db',
        connection: 'connected',
        poolSize: 10,
        version: '14.0.0',
        activeConnections: 3,
        maxConnections: 100,
        queryCount: 12543
      }
    },
    {
      name: 'filesystem',
      status: 'up',
      responseTime: 2,
      required: true,
      lastCheck: new Date().toISOString(),
      details: {
        totalSpace: '500 GB',
        freeSpace: '350 GB',
        usedSpace: '150 GB',
        usagePercent: 30
      }
    },
    {
      name: 'redis',
      status: 'up',
      responseTime: 8,
      required: false,
      lastCheck: new Date().toISOString(),
      details: {
        version: '7.0.0',
        usedMemory: '128 MB',
        connectedClients: 5,
        uptimeInSeconds: 604800
      }
    },
    {
      name: 'external_api',
      status: 'warning',
      responseTime: 320,
      required: false,
      lastCheck: new Date().toISOString(),
      error: 'High latency detected',
      details: {
        endpoint: 'https://api.example.com/verify',
        timeout: 500,
        successRate: 85.5
      }
    },
    {
      name: 'email_service',
      status: 'down',
      responseTime: 1500,
      required: false,
      lastCheck: new Date(Date.now() - 300000).toISOString(),
      error: 'Connection timeout',
      details: {
        provider: 'SMTP',
        host: 'smtp.example.com',
        port: 587,
        lastSuccessful: new Date(Date.now() - 3600000).toISOString()
      }
    },
    {
      name: 'queue',
      status: 'up',
      responseTime: 15,
      required: true,
      lastCheck: new Date().toISOString(),
      details: {
        queueType: 'RabbitMQ',
        messages: 23,
        consumers: 3,
        processingRate: 120
      }
    }
  ],
  services: [
    {
      name: 'database',
      status: 'up',
      responseTime: 45,
      required: true,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'filesystem',
      status: 'up',
      responseTime: 2,
      required: true,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'queue',
      status: 'up',
      responseTime: 15,
      required: true,
      lastCheck: new Date().toISOString()
    }
  ],
  metrics: {
    cpu: {
      loadAverage: {
        1: 0.75,
        5: 0.68,
        15: 0.62
      },
      cores: 8,
      model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz'
    },
    memory: {
      total: '16 GB',
      free: '8.2 GB',
      used: '7.8 GB',
      usagePercent: 48.75
    },
    os: {
      platform: 'linux',
      release: '5.15.0-91-generic',
      type: 'Linux',
      arch: 'x64',
      uptime: 612900
    },
    process: {
      pid: 12345,
      uptime: 612900,
      memoryUsage: {
        rss: 256000000,
        heapTotal: 192000000,
        heapUsed: 128000000,
        external: 32000000,
        arrayBuffers: 8000000
      },
      version: '18.17.0'
    },
    network: {
      hostname: 'verifier-server',
      externalIPs: ['203.0.113.45', '2001:db8::1']
    }
  }
};

// For testing different states
export const mockHealthDataWarning: HealthResponse = {
  ...mockHealthData,
  status: 'warning',
  checks: mockHealthData.checks.map(check => 
    check.name === 'database' ? { ...check, status: 'warning', responseTime: 150 } : check
  )
};

export const mockHealthDataDown: HealthResponse = {
  ...mockHealthData,
  status: 'down',
  checks: mockHealthData.checks.map(check => ({
    ...check,
    status: check.name === 'filesystem' ? 'down' : 'warning',
    responseTime: check.name === 'filesystem' ? 5000 : check.responseTime * 2
  }))
};

export const mockHealthDataDegraded: HealthResponse = {
  ...mockHealthData,
  status: 'warning',
  metrics: {
    ...mockHealthData.metrics,
    cpu: {
      ...mockHealthData.metrics.cpu,
      loadAverage: {
        1: 6.8,
        5: 5.2,
        15: 4.1
      }
    },
    memory: {
      ...mockHealthData.metrics.memory,
      free: '512 MB',
      used: '15.5 GB',
      usagePercent: 96.8
    }
  }
};

// For quick testing in development
export const mockHealthDataSimple: HealthResponse = {
  status: 'up',
  timestamp: new Date().toISOString(),
  uptime: '1 hour, 23 minutes',
  environment: 'development',
  checks: [
    {
      name: 'database',
      status: 'up',
      responseTime: 12,
      required: true,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'filesystem',
      status: 'up',
      responseTime: 1,
      required: true,
      lastCheck: new Date().toISOString()
    }
  ],
  services: [
    {
      name: 'database',
      status: 'up',
      responseTime: 12,
      required: true,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'filesystem',
      status: 'up',
      responseTime: 1,
      required: true,
      lastCheck: new Date().toISOString()
    }
  ],
  metrics: {
    cpu: {
      loadAverage: {
        1: 0.2,
        5: 0.18,
        15: 0.15
      },
      cores: 4,
      model: 'Intel(R) Core(TM) i7-1165G7'
    },
    memory: {
      total: '16 GB',
      free: '12 GB',
      used: '4 GB',
      usagePercent: 25
    },
    os: {
      platform: 'darwin',
      release: '22.6.0',
      type: 'Darwin',
      arch: 'x64',
      uptime: 4980
    },
    process: {
      pid: 9876,
      uptime: 4980,
      memoryUsage: {
        rss: 128000000,
        heapTotal: 96000000,
        heapUsed: 64000000,
        external: 16000000,
        arrayBuffers: 4000000
      },
      version: '18.17.0'
    },
    network: {
      hostname: 'local-dev',
      externalIPs: ['192.168.1.100']
    }
  }
};
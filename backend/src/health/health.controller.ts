import { Controller, Get, ParseBoolPipe, Query } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('System Health')
@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Get system health status',
    description: 'Returns comprehensive health check of all major system components',
  })
  @ApiQuery({
    name: 'detailed',
    required: false,
    type: Boolean,
    description: 'Include detailed metrics and service status',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
    schema: {
      example: {
        status: 'up',
        timestamp: '2024-01-15T10:30:00Z',
        version: '1.0.0',
        uptime: '2d 5h 30m 15s',
        environment: 'production',
        checks: [
          {
            name: 'PostgreSQL Database',
            status: 'up',
            responseTime: 12,
            required: true,
            lastCheck: '2024-01-15T10:30:00Z',
            details: {
              host: 'localhost',
              database: 'identragate',
              connection: 'established',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'System is unhealthy',
    schema: {
      example: {
        status: 'down',
        timestamp: '2024-01-15T10:30:00Z',
        version: '1.0.0',
        uptime: '2d 5h 30m 15s',
        environment: 'production',
        checks: [
          {
            name: 'PostgreSQL Database',
            status: 'down',
            responseTime: 5000,
            required: true,
            lastCheck: '2024-01-15T10:30:00Z',
            error: 'Connection refused',
            details: {
              host: 'localhost',
              database: 'identragate',
              connection: 'failed',
            },
          },
        ],
      },
    },
  })
  async getHealth(@Query('detailed', ParseBoolPipe) detailed?: boolean) {
    const health = await this.healthService.checkHealth(detailed === true);

    const statusCode = health.status === 'down' ? 503 : 200;

    return {
      ...health,
      statusCode,
    };
  }

  @Get('light')
  @ApiOperation({
    summary: 'Get lightweight health status',
    description: 'Quick health check returning only essential status',
  })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
    schema: {
      example: {
        status: 'up',
        timestamp: '2024-01-15T10:30:00Z',
        version: '1.0.0',
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'System is unhealthy',
    schema: {
      example: {
        status: 'down',
        timestamp: '2024-01-15T10:30:00Z',
        version: '1.0.0',
      },
    },
  })
  async getLightHealth() {
    return this.healthService.checkHealthLight();
  }

  @Get('database')
  @ApiOperation({
    summary: 'Check database health',
    description: 'Detailed health check for the database connection',
  })
  @ApiResponse({
    status: 200,
    description: 'Database is healthy',
    schema: {
      example: {
        status: 'up',
        database: 'PostgreSQL',
        host: 'localhost',
        responseTime: 15,
        connection: 'established',
      },
    },
  })
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Get system metrics',
    description: 'Detailed system metrics including CPU, memory, and disk usage',
  })
  @ApiResponse({
    status: 200,
    description: 'System metrics retrieved',
    schema: {
      example: {
        timestamp: '2024-01-15T10:30:00Z',
        metrics: {
          cpu: {
            usage: 45.2,
            cores: 4,
            loadAverage: [1.2, 1.5, 1.8],
          },
          memory: {
            total: 8589934592,
            free: 2576980377,
            used: 6012954215,
            usagePercent: 70,
          },
          disk: {
            total: 107374182400,
            free: 53687091200,
            used: 53687091200,
            usagePercent: 50,
          },
          uptime: 192615,
        },
      },
    },
  })
  async getMetrics() {
    const metrics = await this.healthService.getSystemMetrics();
    return {
      timestamp: new Date().toISOString(),
      metrics,
    };
  }
}
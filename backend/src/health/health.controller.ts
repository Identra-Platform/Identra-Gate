import { Controller, Get, Query } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get system health status',
    description: 'Returns comprehensive health check of all major system components'
  })
  @ApiQuery({
    name: 'detailed',
    required: false,
    type: Boolean,
    description: 'Include detailed metrics and service status'
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
              connection: 'established'
            }
          }
        ]
      }
    }
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
              connection: 'failed'
            }
          }
        ]
      }
    }
  })
  async getHealth(@Query('detailed') detailed?: boolean) {
    const health = await this.healthService.checkHealth(detailed === true);

    const statusCode = health.status === 'down' ? 503 : 200;

    return {
      ...health,
      statusCode
    };
  }

  @Get('light')
  @ApiOperation({ 
    summary: 'Get lightweight health status',
    description: 'Quick health check returning only essential status'
  })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
    schema: {
      example: {
        status: 'up',
        timestamp: '2024-01-15T10:30:00Z',
        version: '1.0.0'
      }
    }
  })
  async getLightHealth() {
    return this.healthService.checkHealthLight();
  }

  @Get('database')
  @ApiOperation({ 
    summary: 'Check database health',
    description: 'Detailed health check for the database connection'
  })
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Get system metrics',
    description: 'Detailed system metrics including CPU, memory, and disk usage'
  })
  async getMetrics() {
    const metrics = await this.healthService.getSystemMetrics();
    return {
      timestamp: new Date().toISOString(),
      metrics,
    };
  }
}

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
  async getHealth(@Query('detailed', ParseBoolPipe) detailed?: boolean) {
    const health = await this.healthService.checkHealth(detailed === true);

    const statusCode = health.status === 'down' ? 503 : 200;

    return {
      ...health,
      statusCode,
    };
  }

  @Get('light')
  async getLightHealth() {
    return this.healthService.checkHealthLight();
  }

  @Get('database')
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }

  @Get('metrics')
  async getMetrics() {
    const metrics = await this.healthService.getSystemMetrics();
    return {
      timestamp: new Date().toISOString(),
      metrics,
    };
  }
}
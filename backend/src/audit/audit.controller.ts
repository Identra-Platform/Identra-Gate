import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ActivityLog } from './entities/activity.entity';
import { AuditService } from './audit.service';
import { UsersService } from 'src/users/users.service';

@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService
  ) {}

  @Get('logs/recent')
  async getRecentLogs(
    @Query('limit') limit?: number
  ): Promise<ActivityLog[]> {
    return this.auditService.getRecentActivities(limit);
  }

  @Get('statistics')
  async getStatistics() {
    return this.auditService.getStatistics();
  }
}

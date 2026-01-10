import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ActivityLog } from './entities/activity.entity';
import { AuditService } from './audit.service';
import { UsersService } from 'src/users/users.service';

@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly userService: UsersService
  ) {}

  @Get('logs/recent')
  async getRecentLogs(
    @Query('limit') limit?: number
  ): Promise<ActivityLog[]> {
    return this.auditService.getRecentActivities(limit);
  }

  @Get('logs/:userId')
  async getLogsById(@Param('userId') userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) return [];
    return this.auditService.getUserActivities(user);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogLevel } from './entities/log.entity';

@Controller('logs')
export class LogsController {
  constructor(
    private readonly logsService: LogsService
  ) {}

  @Get()
  findAll(
    @Query('level') level?: LogLevel,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    return this.logsService.getLogs(level, fromDate, toDate, limit);
  }
}

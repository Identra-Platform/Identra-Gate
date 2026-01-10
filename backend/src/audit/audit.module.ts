import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity.entity';
import { User } from 'src/users/entities/user.entity';
import { ActivityInterceptor } from './interceptor/activity.interceptor';
import { AuditController } from './audit.controller';
import { UsersModule } from 'src/users/users.module';
import { HealthModule } from 'src/health/health.module';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog, User]),
    UsersModule, HealthModule
  ],
  providers: [AuditService, ActivityInterceptor],
  exports: [AuditService, ActivityInterceptor],
  controllers: [AuditController]
})
export class AuditModule {}

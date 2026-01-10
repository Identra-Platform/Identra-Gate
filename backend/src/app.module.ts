import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '../database/datasource';
import { CredentialsModule } from './credentials/credentials.module';
import { NetworkInfoModule } from './network-info/network-info.module';
import { VerificationModule } from './verification/verification.module';
import { CredoModule } from './credo/credo.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuditModule } from './audit/audit.module';
import { ActivityInterceptor } from './audit/interceptor/activity.interceptor';

@Module({
  imports: [
    ConfigModule,
    HealthModule,
    UsersModule,
    CredoModule,
    TypeOrmModule.forRoot(dataSourceOptions),
    CredentialsModule,
    NetworkInfoModule,
    VerificationModule,
    AuthModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_INTERCEPTOR,
    useClass: ActivityInterceptor,
  }],
})
export class AppModule {}

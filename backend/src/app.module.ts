import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { SetupModule } from './setup/setup.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '../database/datasource';
import { LogsModule } from './audit/logs/logs.module';
import { MetricsModule } from './audit/metrics/metrics.module';
import { CredentialModule } from './credential/credential.module';

@Module({
  imports: [
    ConfigModule,
    SetupModule,
    HealthModule,
    UsersModule,
    LogsModule,
    MetricsModule,
    TypeOrmModule.forRoot(dataSourceOptions),
    CredentialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

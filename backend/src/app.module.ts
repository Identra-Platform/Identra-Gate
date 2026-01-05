import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '../database/datasource';
import { LogsModule } from './audit/logs/logs.module';
import { MetricsModule } from './audit/metrics/metrics.module';
import { OpenId4VcModule } from './openid4vc/openid4vc.module';
import { CredentialsModule } from './credentials/credentials.module';
import { NetworkInfoModule } from './network-info/network-info.module';

@Module({
  imports: [
    ConfigModule,
    HealthModule,
    UsersModule,
    LogsModule,
    MetricsModule,
    TypeOrmModule.forRoot(dataSourceOptions),
    OpenId4VcModule,
    CredentialsModule,
    NetworkInfoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

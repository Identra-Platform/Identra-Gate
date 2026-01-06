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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

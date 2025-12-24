import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CredentialsModule } from './credentials/credentials.module';
import { VerificationModule } from './verification/verification.module';
import { SessionsModule } from './sessions/sessions.module';
import { SetupModule } from './setup/setup.module';
import { RecoveryModule } from './recovery/recovery.module';
import { AuditModule } from './audit/audit.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database.service';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config.service';

@Module({
  imports: [AuthModule, UsersModule, CredentialsModule, VerificationModule, SessionsModule, SetupModule, RecoveryModule, AuditModule, DatabaseModule, ConfigModule],
  controllers: [AppController, HealthController],
  providers: [AppService, HealthService, DatabaseService, ConfigService],
})
export class AppModule {}

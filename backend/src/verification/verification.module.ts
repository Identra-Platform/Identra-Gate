import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { ConfigModule } from 'src/config/config.module';
import { VerificationController } from './verification.controller';
import { CredoModule } from 'src/credo/credo.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    CredoModule, ConfigModule,
    AuthModule
  ],
  providers: [VerificationService],
  controllers: [VerificationController]
})
export class VerificationModule {}

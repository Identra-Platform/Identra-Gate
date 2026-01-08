import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { ConfigModule } from 'src/config/config.module';
import { VerificationController } from './verification.controller';
import { CredoModule } from 'src/credo/credo.module';

@Module({
  imports: [
    CredoModule, ConfigModule
  ],
  providers: [VerificationService],
  controllers: [VerificationController]
})
export class VerificationModule {}

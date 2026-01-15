import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { ConfigModule } from 'src/config/config.module';
import { VerificationController } from './verification.controller';
import { CredoModule } from 'src/credo/credo.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationSession } from './entities/verification-session.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    CredoModule, ConfigModule, TypeOrmModule.forFeature([VerificationSession, User])
  ],
  providers: [VerificationService],
  controllers: [VerificationController]
})
export class VerificationModule {}

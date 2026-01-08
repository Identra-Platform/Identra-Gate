import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { ConfigModule } from 'src/config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuedCredential } from '../credo/entities/issued-credential.entity';
import { CredoModule } from 'src/credo/credo.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [CredoModule, ConfigModule, TypeOrmModule.forFeature([IssuedCredential]),
    AuthModule
  ],
  providers: [CredentialsService],
  controllers: [CredentialsController]
})
export class CredentialsModule {}

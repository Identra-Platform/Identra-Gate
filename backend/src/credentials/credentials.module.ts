import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { ConfigModule } from 'src/config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredoModule } from 'src/credo/credo.module';
import { TemplatesModule } from './templates/templates.module';
import { Credential } from './entities/credential.entity';
import { User } from 'src/users/entities/user.entity';
import { CredentialTemplate } from './templates/entities/credential-template.entity';

@Module({
  imports: [CredoModule, ConfigModule, TypeOrmModule.forFeature([
    Credential, User, CredentialTemplate
  ]), TemplatesModule],
  providers: [CredentialsService],
  controllers: [CredentialsController]
})
export class CredentialsModule {}

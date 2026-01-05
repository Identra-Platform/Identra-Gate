import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { OpenId4VcModule } from 'src/openid4vc/openid4vc.module';
import { ConfigModule } from 'src/config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuedCredential } from './entities/issued-credential.entity';

@Module({
  imports: [OpenId4VcModule, ConfigModule, TypeOrmModule.forFeature([IssuedCredential])],
  providers: [CredentialsService],
  controllers: [CredentialsController]
})
export class CredentialsModule {}

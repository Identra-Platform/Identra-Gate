import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { CredentialConfigService } from './credential-config.service';

@Global()
@Module({
  providers: [ConfigService, CredentialConfigService],
  exports: [ConfigService, CredentialConfigService],
})
export class ConfigModule {}

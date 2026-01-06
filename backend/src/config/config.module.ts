import { Global, Module } from '@nestjs/common';
import { EnvService } from './services/env.service';
import { DatabaseConfigService } from './services/database-config.service';
import { AuthConfigService } from './services/auth-config.service';
import { ServerConfigService } from './services/server-config.service';
import { DidsConfigService } from './services/dids-config.service';
import { EmailConfigService } from './services/email-config.service';
import { LoggingConfigService } from './services/logging-config.service';
import { AgentConfigService } from './services/agent-config.service';
import { OpenId4VcConfigService } from './services/openid4vc-config.service';
import { CredentialsConfigService } from './services/credentials-config.service';
import { AppConfigService } from './services/app-config.service';
import { OfferedCredentialsConfigService } from './services/offered-credentials-config.service';

@Global()
@Module({
  providers: [
    EnvService,
    DatabaseConfigService,
    AuthConfigService,
    ServerConfigService,
    DidsConfigService,
    EmailConfigService,
    LoggingConfigService,
    AgentConfigService,
    OpenId4VcConfigService,
    CredentialsConfigService,
    AppConfigService,
    OfferedCredentialsConfigService,
  ],
  exports: [
    EnvService,
    DatabaseConfigService,
    AuthConfigService,
    ServerConfigService,
    DidsConfigService,
    EmailConfigService,
    LoggingConfigService,
    AgentConfigService,
    OpenId4VcConfigService,
    CredentialsConfigService,
    AppConfigService,
    OfferedCredentialsConfigService,
  ],
})
export class ConfigModule {}

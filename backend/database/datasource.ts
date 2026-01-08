import { runSeeders, SeederOptions } from 'typeorm-extension';
import { User } from '../src/users/entities/user.entity';
import { DataSource, DataSourceOptions } from 'typeorm';
import { IssuedCredential } from 'src/credo/entities/issued-credential.entity';
import { AppConfigService } from 'src/config/services/app-config.service';
import { DatabaseConfigService } from 'src/config/services/database-config.service';
import { AuthConfigService } from 'src/config/services/auth-config.service';
import { ServerConfigService } from 'src/config/services/server-config.service';
import { DidsConfigService } from 'src/config/services/dids-config.service';
import { EmailConfigService } from 'src/config/services/email-config.service';
import { LoggingConfigService } from 'src/config/services/logging-config.service';
import { AgentConfigService } from 'src/config/services/agent-config.service';
import { OpenId4VcConfigService } from 'src/config/services/openid4vc-config.service';
import { CredentialsConfigService } from 'src/config/services/credentials-config.service';
import { EnvService } from 'src/config/services/env.service';
import { LoginAttempt } from 'src/auth/entities/login-attempt.entity';

const envService = new EnvService();
const configService = new AppConfigService(
  new DatabaseConfigService(envService),
  new AuthConfigService(envService),
  new ServerConfigService(envService),
  new DidsConfigService(envService),
  new EmailConfigService(envService),
  new LoggingConfigService(envService),
  new AgentConfigService(envService),
  new OpenId4VcConfigService(envService),
  new CredentialsConfigService(envService)
);

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.database.host,
  port: configService.database.port,
  username: configService.database.username,
  password: configService.database.password,
  database: configService.database.database,
  entities: [User, IssuedCredential,LoginAttempt],
  migrations: ['./migration/**/*{.js,.ts}'],
  synchronize: true,
};

const dataSource = new DataSource(dataSourceOptions);

(async () => {
  await dataSource.initialize();
  runSeeders(dataSource, {
    seeds: ['database/seeds/**/*{.ts,.js}'],
    factories: ['database/factories/**/*{.ts,.js}'],
  });
})();

export default dataSource;

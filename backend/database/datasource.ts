import { runSeeders, SeederOptions } from "typeorm-extension";
import { ConfigService } from "../src/config/config.service";
import { Role } from "../src/users/entities/role.entity";
import { User } from "../src/users/entities/user.entity";
import { DataSource, DataSourceOptions } from "typeorm";
import { Log } from "../src/audit/logs/entities/log.entity";
import { Offering } from "src/credential/offerings/entities/offering.entity";
import { OfferingRequirement } from "src/credential/offerings/entities/offering-requirement.entity";


const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.database.host,
  port: configService.database.port,
  username: configService.database.username,
  password: configService.database.password,
  database: configService.database.database,
  entities: [
    User, Role, Log, Offering, OfferingRequirement
  ],
  migrations: [
    './migration/**/*{.js,.ts}'
  ],
  synchronize: true
}

const dataSource = new DataSource(dataSourceOptions);

(async () => {
  await dataSource.initialize();
  runSeeders(dataSource, {
    seeds: ['database/seeds/**/*{.ts,.js}'],
    factories: ['database/factories/**/*{.ts,.js}']
  });
}) ();

export default dataSource;
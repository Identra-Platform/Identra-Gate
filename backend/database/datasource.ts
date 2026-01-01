import { runSeeders, SeederOptions } from "typeorm-extension";
import { ConfigService } from "../src/config/config.service";
import { Role } from "../src/users/entities/role.entity";
import { User } from "../src/users/entities/user.entity";
import { DataSource, DataSourceOptions } from "typeorm";


const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.database.host,
  port: configService.database.port,
  username: configService.database.username,
  password: configService.database.password,
  database: configService.database.database,
  entities: [
    User, Role
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
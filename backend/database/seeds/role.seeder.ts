import { UserRole } from '../../src/users/entities/role.entity';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

export default class RoleSeeder implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const repository = dataSource.getRepository('Role');

    if ((await repository.count()) === 0) {
      await repository.insert([
        { role: UserRole.Admin },
        { role: UserRole.Verifier },
        { role: UserRole.Issuer },
      ]);
    }
  }
}

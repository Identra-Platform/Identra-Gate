import { UserRole } from "../../src/users/types/user-role.type";
import { User } from "../../src/users/entities/user.entity";
import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";
import * as bcrypt from 'bcrypt';

export default class UserSeeder implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const repository = dataSource.getRepository<User>('User');

    let admin = await repository.findOne({
      where: {
        name: 'admin'
      }
    });

    if (admin) return;
    admin = repository.create({
      email: 'admin@example.com',
      name: 'admin',
      roles: [UserRole.Admin],
      password: await bcrypt.hash('admin', 10)
    });
    await repository.save(admin);
  }
}
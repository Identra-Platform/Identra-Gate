import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { SetupModule } from './setup/setup.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config/config.service';
import { User } from './users/entities/user.entity';
import { Role } from './users/entities/role.entity';
import { dataSourceOptions } from '../database/datasource';

@Module({
  imports: [ConfigModule, SetupModule, HealthModule, UsersModule,
    TypeOrmModule.forRoot(dataSourceOptions)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './entities/log.entity';
import { User } from '../../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Log, User])],
  providers: [LogsService],
  controllers: [LogsController]
})
export class LogsModule {}

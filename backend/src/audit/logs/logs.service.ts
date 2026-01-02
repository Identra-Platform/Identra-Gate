import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Log, LogLevel } from './entities/log.entity';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async log(message: string, userId: string, level: LogLevel) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
    });

    const log = this.logRepository.create({
      level,
      timestamp: new Date(),
      message,
      user,
    });

    return await this.logRepository.save(log);
  }

  async getLogs(
    level: LogLevel = LogLevel.Error,
    from?: Date,
    to?: Date,
    limit: number = 100,
  ) {
    const queryBuilder = this.logRepository
      .createQueryBuilder('log')
      .where('log.level = :level', { level })
      .take(limit)
      .orderBy('log.timestamp', 'DESC');

    if (from) {
      queryBuilder.andWhere('log.timestamp >= :from', { from });
    }
    if (to) {
      queryBuilder.andWhere('log.timestamp <= :to', { to });
    }

    const [logs, filtered] = await queryBuilder.getManyAndCount();
    const total = await this.logRepository.count();

    return {
      logs,
      total,
      filtered,
    };
  }
}

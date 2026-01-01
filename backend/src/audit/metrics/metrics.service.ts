import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Between, Repository } from 'typeorm';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async getMetrics(from?: Date, to?: Date) {
    const userQueryBuilder = this.userRepository.createQueryBuilder('user');
    if (from) {
      userQueryBuilder.andWhere('user.createdAt >= :from', { from });
    }
    if (to) {
      userQueryBuilder.andWhere('user.createdAt <= :to', { to });
    }
    const totalUsers = await userQueryBuilder.getCount();

    return {
      users: { total: totalUsers }
    }
  }
}

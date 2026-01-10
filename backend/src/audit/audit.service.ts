import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityAction, ActivityLog, ActivityStatus } from './entities/activity.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { HealthService } from 'src/health/health.service';

export interface ActivityLogParams {
  userId: string;
  action: ActivityAction;
  status: ActivityStatus;
  error?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly healthService: HealthService
  ) {}

  async logActivity(params: ActivityLogParams) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: params.userId }
    });
    const activity = this.activityLogRepository.create({
      ...params,
      user
    });
    return this.activityLogRepository.save(activity);
  }

  async getUserActivities(user: User): Promise<ActivityLog[]> {
    return this.activityLogRepository.findBy({
      user: {
        id: user.id
      }
    });
  }

  async getRecentActivities(limit = 50): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      order: { timestamp: 'DESC' },
      take: limit ?? undefined,
      relations: ['user']
    });
  }

  async getStatistics() {
    const totalUsers = await this.userRepository.count();
  }
}

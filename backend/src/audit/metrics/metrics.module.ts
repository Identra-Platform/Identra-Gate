import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [MetricsService],
  controllers: [MetricsController]
})
export class MetricsModule {}

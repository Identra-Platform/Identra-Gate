import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { SetupModule } from './setup/setup.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule, SetupModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

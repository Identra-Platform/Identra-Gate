import { Module } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
import { CredoAgentService } from 'src/credo-agent/credo-agent.service';

@Module({
  controllers: [SetupController],
  providers: [SetupService, CredoAgentService]
})
export class SetupModule {}

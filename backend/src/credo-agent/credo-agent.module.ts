import { Module } from '@nestjs/common';
import { CredoAgentService } from './credo-agent.service';
import { AgentStoreService } from './credo-agent-store';

@Module({
  providers: [CredoAgentService, AgentStoreService],
  exports: [CredoAgentService, AgentStoreService],
})
export class CredoAgentModule {}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Agent, DidsModule } from '@credo-ts/core';
import { AskarModule } from '@credo-ts/askar';
import { askar } from '@openwallet-foundation/askar-nodejs';
import { DidCommModule, DidCommWsOutboundTransport } from '@credo-ts/didcomm';
import {
  HederaAnonCredsRegistry,
  HederaDidRegistrar,
  HederaDidResolver,
  HederaModule,
} from '@credo-ts/hedera';
import { AnonCredsModule } from '@credo-ts/anoncreds';
import { anoncreds } from '@hyperledger/anoncreds-nodejs';
import { agentDependencies } from '@credo-ts/node';
import { AgentStoreService } from './credo-agent-store';

type AgentModulesMap = {
  didcomm: DidCommModule<{
    transports: {
      outbound: DidCommWsOutboundTransport[];
    };
  }>;
  askar: AskarModule;
  dids: DidsModule;
  anoncreds: AnonCredsModule;
  hedera: HederaModule;
};

@Injectable()
export class CredoAgentService implements OnModuleInit {
  private agent: Agent<AgentModulesMap> | null = null;

  constructor(private readonly agentStore: AgentStoreService) {}

  async onModuleInit() {
    if (this.agentStore.hasConfig()) {
      await this.loadAndInit();
    }
  }

  async create(password: string) {
    if (this.agentStore.hasConfig()) {
      throw new Error('Agent already exists');
    }

    const walletId = this.generateWalletId();
    await this.agentStore.create(password);
    
    return this.initializeAgent(walletId, password);
  }

  async loadAndInit() {
    if (this.agent) {
      return this.agent;
    }

    const config = this.agentStore.getConfig();
    
    this.agent = new Agent({
      dependencies: agentDependencies,
      modules: {
        didcomm: new DidCommModule({
          transports: {
            outbound: [new DidCommWsOutboundTransport()],
          },
        }),
        askar: new AskarModule({
          askar,
          store: {
            id: config.walletId,
            key: config.walletKey,
          },
        }),
        dids: new DidsModule({
          registrars: [new HederaDidRegistrar()],
          resolvers: [new HederaDidResolver()],
        }),
        anoncreds: new AnonCredsModule({
          registries: [new HederaAnonCredsRegistry()],
          anoncreds,
        }),
        hedera: new HederaModule({
          networks: [
            {
              network: 'testnet',
              operatorId: '0.0.7427588',
              operatorKey: '302e020100300506032b657004220420b1f5f5f4e1c3e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4',
            },
          ],
        }),
      },
    });

    await this.agent.initialize();
    return this.agent;
  }

  getAgent(): Agent {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }
    return this.agent;
  }

  async shutdown() {
    if (this.agent) {
      await this.agent.shutdown();
      this.agent = null;
    }
  }

  async createDid(alias?: string) {
    const agent = this.getAgent();
    const didResult = await agent.dids.create({
      method: 'key',
      alias,
    });
    return didResult.didState.did;
  }

  private async initializeAgent(walletId: string, walletKey: string) {
    this.agent = new Agent({
      dependencies: agentDependencies,
      modules: {
        didcomm: new DidCommModule({
          transports: {
            outbound: [new DidCommWsOutboundTransport()],
          },
        }),
        askar: new AskarModule({
          askar,
          store: {
            id: walletId,
            key: walletKey,
          },
        }),
        dids: new DidsModule({
          registrars: [new HederaDidRegistrar()],
          resolvers: [new HederaDidResolver()],
        }),
        anoncreds: new AnonCredsModule({
          registries: [new HederaAnonCredsRegistry()],
          anoncreds,
        }),
        hedera: new HederaModule({
          networks: [
            {
              network: 'testnet',
              operatorId: '0.0.7427588',
              operatorKey: '302e020100300506032b657004220420b1f5f5f4e1c3e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4',
            },
          ],
        }),
      },
    });

    await this.agent.initialize();
    return this.agent;
  }

  private generateWalletId(): string {
    return `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
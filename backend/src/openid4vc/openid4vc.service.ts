import '@openwallet-foundation/askar-nodejs';

import { Agent, ConsoleLogger, DidsModule, LogLevel, ModulesMap } from '@credo-ts/core';
import { OpenId4VcModule, OpenId4VcVerifierRepository } from '@credo-ts/openid4vc';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {} from 'src/audit/logs/logs.service';
import { ConfigService } from 'src/config/config.service';
import { HttpAdapterHost } from '@nestjs/core';
import { Express } from 'express';
import { agentDependencies } from '@credo-ts/node';
import { AskarModule, AskarStoreManager } from '@credo-ts/askar';
import { askar } from '@openwallet-foundation/askar-nodejs';
import type { OpenId4VcApi, OpenId4VcHolderApi, OpenId4VcIssuerRecord, OpenId4VcModuleConfigOptions, OpenId4VcVerifierRecord } from '@credo-ts/openid4vc';
import { CredentialConfigService } from 'src/config/credential-config.service';
import { HederaDidCreateOptions, HederaDidRegistrar, HederaDidResolver, HederaModule } from '@credo-ts/hedera';
import { OpenId4VcIssuerRepository } from 'node_modules/@credo-ts/openid4vc/build/openid4vc-issuer/repository/OpenId4VcIssuerRepository.mjs';

process.removeAllListeners('unhandledRejection');

export interface CredentialRequestPayload {
  credentialRequest: any;
  metadata: {
    issuerState?: string;
    preAuthorizedCode?: string;
    clientId?: string;
  };
}

export interface CredentialResponse {
  credential: any;
  format: string;
  notification?: {
    subject: string;
    body: string;
  };
}

type AgentModules = {
  askar: AskarModule;
  hedera: HederaModule;
  dids: DidsModule;
  openid4vc: OpenId4VcModule;
};

@Injectable()
export class OpenId4VcService implements OnModuleDestroy, OnModuleInit {
  private agent: Agent<AgentModules> | null = null;
  private readonly logger = new Logger(OpenId4VcService.name);
  private expressApp: Express;
  private enabledModules: ModulesMap;
  private issuer?: OpenId4VcIssuerRecord;
  private verifier?: OpenId4VcVerifierRecord;
  private holder?: OpenId4VcHolderApi;

  private credentialRequestHandler?: (
    payload: CredentialRequestPayload,
  ) => Promise<CredentialResponse>;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly credentialConfigService: CredentialConfigService
  ) {}

  async onModuleInit() { 
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    if (httpAdapter.getType() === 'express') {
      this.expressApp = httpAdapter.getInstance();

      await this.initialize();

      if (!this.agent) throw new Error('Could not Initialize Agent');
    }
  }

  setCredentialRequestHandler(
    handler: (payload: CredentialRequestPayload) => Promise<CredentialResponse>
  ) { this.credentialRequestHandler = handler; }

  async initialize() {
    const config = this.configService.openId4Vc;

    if (!config.issuer.enabled && !config.verifier.enabled) return;

    try {
      await this.initializeAgent();

      /* DEBUG */
      //await this.resetRecords();

      await this.initializeActors();
    } catch (error) {
      throw error;
    }
  }

  private async resetRecords(){
    if (!this.agent) return;

    await this.agent.modules.askar.deleteStore();
    await this.agent.modules.askar.provisionStore();
  }

  private async initializeAgent() {
    const config = this.configService.openId4Vc;
    const agentConfig = this.configService.agent;

    const openId4VcConfig: OpenId4VcModuleConfigOptions = {
      app: this.expressApp
    };

    if (config.issuer.enabled) {
      openId4VcConfig.issuer = {
        baseUrl: config.issuer.baseUrl,
        credentialRequestToCredentialMapper: async (args) => {
          if (!this.credentialRequestHandler) {
            throw new Error('No credential request handler set');
          }

          const payload: CredentialRequestPayload = {
            credentialRequest: args.credentialRequest,
            metadata: {
              issuerState: args.issuanceSession.state
            }
          };

          const response = await this.credentialRequestHandler(payload);

          return {
            credentials: [response.credential],
            format: 'vc+sd-jwt',
            type: 'credentials'          
          };
        }
      };
    }

    if (config.verifier.enabled){
      openId4VcConfig.verifier = {
        baseUrl: config.verifier.baseUrl
      };
    }

    const modules: AgentModules = {
      askar: new AskarModule({
        askar,
        store: {
          id: agentConfig.walletId,
          key: agentConfig.walletKey
        }
      }),
      hedera: new HederaModule({
        networks: [
          {
            network: 'testnet',
            operatorId: '0.0.7427588',
            operatorKey: '3030020100300706052b8104000a0422042040a1966090a67a93430991beb3defa2e70a05592f2531cf7594f20f35c985efe',
          }
        ]
      }),
      dids: new DidsModule({
        registrars: [new HederaDidRegistrar()],
        resolvers: [new HederaDidResolver()]
      }),
      openid4vc: new OpenId4VcModule(openId4VcConfig)
    };

    this.agent = new Agent({
      config: {
        logger: new ConsoleLogger(LogLevel.debug),
        allowInsecureHttpUrls: true
      },
      dependencies: agentDependencies,
      modules
    });

    await this.agent.initialize();
  }

  private async initializeActors() {
    if (this.configService.openId4Vc.issuer.enabled) {
      const issuerConfig = this.configService.openId4Vc.issuer;

      let issuerDid = issuerConfig.issuerDid;
      if (!issuerDid && issuerConfig.autoCreateDid !== false) {
        issuerDid = await this.createOrGetIssuerDid();
      }

      if (!issuerDid) {
        throw new Error('No issuer DID configured and auto-creation is disabled');
      }

      const config = this.credentialConfigService.convertToOpenId4VciFormat();
      const issuerDisplayConfig = this.credentialConfigService.getIssuerConfig();

      const api = this.agent?.openid4vc as unknown as OpenId4VcApi;
      const existingIssuers = await this.agent?.openid4vc.issuer?.getAllIssuers();
      if (existingIssuers && existingIssuers.length > 0) return;

      this.issuer = await api.issuer!.createIssuer({
        issuerId: this.credentialConfigService.getIssuerConfig().id,
        display: [{
          name: issuerDisplayConfig.name,
          locale: 'en-US',
          ...(issuerDisplayConfig.logo && {
            logo: {
              uri: issuerDisplayConfig.logo,
              alt_text: `${issuerDisplayConfig.name} logo`
            }
          }),
          description: issuerDisplayConfig.description,
          background_color: issuerDisplayConfig.primaryColor,
          text_color: issuerDisplayConfig.textColor
        }],
        credentialConfigurationsSupported: config,
        batchCredentialIssuance: this.credentialConfigService.getSettings().allowBatchIssuance ? {
          batchSize: this.credentialConfigService.getSettings().maxBatchSize
        } : undefined
      });
    }
    if (this.configService.openId4Vc.verifier.enabled) {
      const api = this.agent?.openid4vc as unknown as OpenId4VcApi;
      this.verifier = await api.verifier!.createVerifier({});
    }
  }

  private async createOrGetIssuerDid(): Promise<string> {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    try {
      const issuerDid = this.credentialConfigService.getIssuerDid();
      if (!issuerDid) {
        const result = await this.agent.dids.create<HederaDidCreateOptions>({
          method: 'hedera',
          options: {
            network: 'testnet'
          }
        });
        if (result.didState.state === 'failed') {
          throw new Error('Could not create a new Did: ' + result.didState.reason);
        }

        const did = result.didState.did!;
        this.credentialConfigService.setIssuerDid(did);

        console.log(did);

        return did;
      }
      return issuerDid;
    } catch (error) {
      throw new Error(`Could not create or retrieve an issuer DID: ${error}`);
    }
  }

  getAgent(): Agent | null {
    return this.agent;
  }

  async onModuleDestroy() {
    if (this.agent) {
      await this.agent.shutdown();
    }
  }
}

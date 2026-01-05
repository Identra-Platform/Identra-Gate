import '@openwallet-foundation/askar-nodejs';

import { Agent, ClaimFormat, ConsoleLogger, DidsModule, LogLevel, ModulesMap, SdJwtVcSignOptions } from '@credo-ts/core';
import { OpenId4VcModule, OpenId4VcVerifierRepository } from '@credo-ts/openid4vc';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {} from 'src/audit/logs/logs.service';
import { ConfigService } from 'src/config/config.service';
import { HttpAdapterHost } from '@nestjs/core';
import { Express } from 'express';
import { agentDependencies } from '@credo-ts/node';
import { AskarModule, AskarStoreManager } from '@credo-ts/askar';
import { askar } from '@openwallet-foundation/askar-nodejs';
import type { OpenId4VcApi, OpenId4VcHolderApi, OpenId4VciSignSdJwtCredentials, OpenId4VcIssuerRecord, OpenId4VcModuleConfigOptions, OpenId4VcVerifierRecord } from '@credo-ts/openid4vc';
import { CredentialConfigService } from 'src/config/credential-config.service';
import { HederaDidCreateOptions, HederaDidRegistrar, HederaDidResolver, HederaModule } from '@credo-ts/hedera';
import { OpenId4VcIssuerRepository } from 'node_modules/@credo-ts/openid4vc/build/openid4vc-issuer/repository/OpenId4VcIssuerRepository.mjs';
import { NetworkInfoService } from 'src/network-info/network-info.service';
import { SessionManagerService } from './session-manager/session-manager.service';
import { Repository } from 'typeorm';
import { IssuedCredential } from 'src/credentials/entities/issued-credential.entity';
import { InjectRepository } from '@nestjs/typeorm';

process.removeAllListeners('unhandledRejection');

export interface CredentialRequestPayload {
  credentialRequest: any;
  metadata: {
    sessionId?: string | undefined;
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

  private credentialRequestHandler?: (
    payload: CredentialRequestPayload,
  ) => Promise<CredentialResponse>;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly credentialConfigService: CredentialConfigService,
    private readonly networkInfoService: NetworkInfoService,
    private readonly sessionManager: SessionManagerService,
    @InjectRepository(IssuedCredential)
    private readonly issuedCredentialRepository: Repository<IssuedCredential>
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
      await this.resetRecords();

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

  private async getVerificaitionMethodFromDid(did: string) {
    const result = await this.agent?.dids.resolve(did);
    if (result?.didResolutionMetadata.error) throw result?.didResolutionMetadata.error;

    return result?.didDocument?.verificationMethod![0].id;
  }

  private formatCredential(config: any, claims: any) {
    return {
      ...config,
      vct: config.credentialType,
      fields: {
        ...claims
      }
    };
  }

  private async initializeAgent() {
    const config = this.configService.openId4Vc;
    const agentConfig = this.configService.agent;

    const openId4VcConfig: OpenId4VcModuleConfigOptions = {
      app: this.expressApp
    };

    const baseUrl = `http://${this.networkInfoService.getLocalIP()}:${this.configService.server.port}`;
    if (config.issuer.enabled) {
      const issuerHandler = async (args): Promise<OpenId4VciSignSdJwtCredentials> => {
        const payload: CredentialRequestPayload = {
          credentialRequest: args.credentialRequest,
          metadata: {
            sessionId: args.issuanceSession.issuanceMetadata?.sessionId as string
          }
        };

        const { metadata } = payload;

        const sessionId = metadata.sessionId;
        if (!sessionId) {
          throw new Error('No session ID found in request');
        }

        const sessionData = this.sessionManager.getSession(sessionId);
        if (!sessionData) {
          throw new Error('Session not found');
        }

        const credentialConfig = this.credentialConfigService.getCredentialById(sessionData.credentialId);
        if (!credentialConfig) {
          throw new Error('Credential configuration not found');
        }

        this.sessionManager.completeSession(sessionId);

        const response = {
          credential: this.formatCredential(credentialConfig, sessionData.claims),
          format: credentialConfig.format,
          holderDid: sessionData.holderDid
        };

        const credential = this.credentialConfigService.getCredentialById(sessionData.credentialId);
        const disclosureKeys = credential!.fields.map(field =>
          Array.isArray(field.path) && field.path.length > 0
            ? field.path[field.path.length - 1].toString()
            : field.name
        );

        const result = await Promise.all(args.holderBinding.keys.map(async (binding: any): Promise<SdJwtVcSignOptions> => ({  
          payload: response.credential,  
          holder: binding,
          issuer: {
            method: 'did',
            didUrl: (await this.getVerificaitionMethodFromDid(await this.createOrGetIssuerDid()))!
          },
          disclosureFrame: {
            _sd: disclosureKeys
          }
        })));

        const issuedCredential = await this.issuedCredentialRepository.findOneOrFail({
          where: { transactionId: sessionData.sessionId }
        });
        await this.issuedCredentialRepository.update(issuedCredential, {
          status: 'issued'
        })

        return {
          credentials: result,
          format: ClaimFormat.SdJwtDc,
          type: 'credentials'as const
        };
      };

      openId4VcConfig.issuer = {
        baseUrl: `${baseUrl}${config.issuer.endpoint}`,
        accessTokenExpiresInSeconds: 300,
        credentialRequestToCredentialMapper: issuerHandler
      };
    }

    if (config.verifier.enabled){
      openId4VcConfig.verifier = {
        baseUrl: `${baseUrl}${config.verifier.endpoint}`
      };
    }

    const modules: AgentModules = {
      askar: new AskarModule({
        askar,
        store: {
          id: agentConfig.walletId,
          key: agentConfig.walletKey,
          database: {
            type: 'sqlite',
            config: {
              path: `./data/${this.configService.database.database}`
            }
          }
        },
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
        logger: new ConsoleLogger(LogLevel.trace),
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

      
      const api = this.agent?.openid4vc as unknown as OpenId4VcApi;
      const existingIssuers = await this.agent?.openid4vc.issuer?.getAllIssuers();
      if (existingIssuers && existingIssuers.length > 0) return;
      
      const config = this.credentialConfigService.convertToOpenId4VciFormat();
      const issuerDisplayConfig = this.credentialConfigService.getIssuerConfig();
      
      await api.issuer!.createIssuer({
        issuerId: this.credentialConfigService.getId(),
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
      const existingVerifier = await this.agent?.openid4vc.verifier?.getAllVerifiers();
      if (existingVerifier && existingVerifier.length > 0) return;

      const api = this.agent?.openid4vc as unknown as OpenId4VcApi;
      await api.verifier!.createVerifier({
        verifierId: this.credentialConfigService.getId()
      });
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

        return did;
      }
      return issuerDid;
    } catch (error) {
      throw new Error(`Could not create or retrieve an issuer DID: ${error}`);
    }
  }

  async createCredentialOfferWithClaims(
    credentialId: string,
    claims: Record<string, any>,
    holderDid?: string,
    options?: {
      pinRequired?: boolean;
      pinLength?: number;
    }
  ) {
    const sessionId = this.sessionManager.createSession(credentialId, claims, holderDid);

    const result = await this.issuer?.createCredentialOffer({
      issuerId: this.credentialConfigService.getId(),
      credentialConfigurationIds: [credentialId],
      preAuthorizedCodeFlowConfig: {
        txCode: options?.pinRequired ? {
          input_mode: 'numeric',
          length: options?.pinLength || 4,
          description: 'Accept credential offer'
        } : undefined
      },
      issuanceMetadata: {
        sessionId
      }
    });

    if (!result) {
      throw new Error('Could not create credential offer');
    }
    
    return {
      offerData: result.credentialOffer,
      txCode: result.issuanceSession.userPin,
      sessionId: result.issuanceSession.id,
    };
  }

  getAgent(): Agent | null {
    return this.agent;
  }

  async onModuleDestroy() {
    if (this.agent) {
      await this.agent.shutdown();
    }
  }

  get issuer() {
    return this.agent?.openid4vc.issuer;
  }
  get verifier() {
    return this.agent?.openid4vc.verifier;
  }
}

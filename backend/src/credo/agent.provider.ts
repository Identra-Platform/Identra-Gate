import '@openwallet-foundation/askar-nodejs';
import { forwardRef, Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Agent, ClaimFormat, ConsoleLogger, DcqlQuery, DidsModule, LogLevel, SdJwtVcSignOptions } from '@credo-ts/core';
import { OpenId4VcModule, OpenId4VciCredentialConfigurationsSupportedWithFormats, OpenId4VciCredentialRequestToCredentialMapperOptions, OpenId4VciSignSdJwtCredentials } from '@credo-ts/openid4vc';
import { AskarModule } from '@credo-ts/askar';
import { HederaModule, HederaDidCreateOptions, HederaDidRegistrar, HederaDidResolver } from '@credo-ts/hedera';
import { askar } from '@openwallet-foundation/askar-nodejs';
import { agentDependencies } from '@credo-ts/node';
import { OpenId4VcIssuerRecord, OpenId4VcVerifierRecord } from '@credo-ts/openid4vc';
import { IssuanceSessionData, SessionManagerService, VerificationSessionData } from './session-manager.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OpenId4VcConfigService } from 'src/config/services/openid4vc-config.service';
import { AgentConfigService } from 'src/config/services/agent-config.service';
import { DatabaseConfigService } from 'src/config/services/database-config.service';
import { DidsConfigService } from 'src/config/services/dids-config.service';
import { OfferedCredentialsConfigService } from 'src/config/services/offered-credentials-config.service';
import { HttpAdapterHost } from '@nestjs/core';
import { TemplatesService } from 'src/credentials/templates/templates.service';
import { Credential } from 'src/credentials/entities/credential.entity';

type AgentModules = {
  askar: AskarModule;
  hedera: HederaModule;
  dids: DidsModule;
  openid4vc: OpenId4VcModule;
};

export interface AgentCredentials {
  agent: Agent<AgentModules>;
  issuerRecord?: OpenId4VcIssuerRecord;
  verifierRecord?: OpenId4VcVerifierRecord;
}

export interface CreateCredentialOfferOptions {
  credentialId: string;
  claims: Record<string, any>;
  holderDid?: string;
  pinRequired?: boolean;
  pinLength?: number;
}

@Injectable()
export class AgentProvider implements OnModuleInit, OnModuleDestroy {
  private agentCredentials: AgentCredentials | null = null;
  private isInitializing = false;
  private initializationPromise: Promise<AgentCredentials> | null = null;

  constructor(
    private readonly openId4VcConfig: OpenId4VcConfigService,
    private readonly agentConfig: AgentConfigService,
    private readonly databaseConfig: DatabaseConfigService,
    private readonly didsConfig: DidsConfigService,
    private readonly credentialConfigService: OfferedCredentialsConfigService,
    private readonly sessionManager: SessionManagerService,
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    private readonly httpAdapter: HttpAdapterHost,
    @Inject(forwardRef(() => TemplatesService))
    private readonly templateService: TemplatesService
  ) {}

  async onModuleInit() {
    if (this.shouldInitializeAgent()) {
      await this.initialize();
    }
  }

  async onModuleDestroy() {
    await this.shutdown();
  }

  async initialize(): Promise<AgentCredentials> {
    if (this.agentCredentials) {
      return this.agentCredentials;
    }

    if (this.isInitializing && this.initializationPromise) {
      return this.initializationPromise;
    }

    this.isInitializing = true;
    this.initializationPromise = this.initializeAgent();
    
    try {
      this.agentCredentials = await this.initializationPromise;
      return this.agentCredentials;
    } finally {
      this.isInitializing = false;
      this.initializationPromise = null;
    }
  }

  private async initializeAgent(): Promise<AgentCredentials> {
    const config = this.openId4VcConfig.get();
    
    if (!config.issuer.enabled && !config.verifier.enabled) {
      throw new Error('Neither issuer nor verifier is enabled in OpenID4VC configuration');
    }

    const agent = await this.createAgent();
    
    // DEBUG: Clean slate for development
    if (process.env.NODE_ENV === 'development') {
      //await this.resetAgentStorage(agent);
    }

    const credentials = await this.initializeAgentActors(agent, config);
    
    return {
      agent,
      ...credentials,
    };
  }

  private async createAgent(): Promise<Agent<AgentModules>> {
    const config = this.openId4VcConfig.get();
    const agentConfig = this.agentConfig.get();
    const walletConfig = agentConfig.wallet;

    const openId4VcConfig = this.openId4VcConfig.getOpenId4VcModuleConfig();

    const modules: AgentModules = {
      askar: new AskarModule({
        askar,
        store: {
          id: walletConfig.id,
          key: walletConfig.key,
          database: {
            type: 'sqlite',
            config: {
              path: walletConfig.databasePath || `./data/${this.databaseConfig.get().database}.db`,
            },
          },
        },
      }),
      hedera: new HederaModule({
        networks: [
          {
            network: this.didsConfig.get().network as any || 'testnet',
            operatorId: '0.0.7427588',
            operatorKey: '3030020100300706052b8104000a0422042040a1966090a67a93430991beb3defa2e70a05592f2531cf7594f20f35c985efe',
          },
        ],
      }),
      dids: new DidsModule({
        registrars: [new HederaDidRegistrar()],
        resolvers: [new HederaDidResolver()],
      }),
      openid4vc: new OpenId4VcModule({
        app: this.httpAdapter.httpAdapter.getInstance(),
        ...openId4VcConfig,
        issuer: config.issuer.enabled ? {
          ...openId4VcConfig.issuer,
          credentialRequestToCredentialMapper: this.createCredentialRequestHandler(),
        } : undefined,
      }),
    };

    const agent = new Agent({
      config: {
        logger: new ConsoleLogger(this.mapLogLevel(agentConfig.logLevel)),
        allowInsecureHttpUrls: !process.env.NODE_ENV || process.env.NODE_ENV !== 'production',
      },
      dependencies: agentDependencies,
      modules,
    });

    await agent.initialize();
    return agent;
  }

  private createCredentialRequestHandler() {
    return async (args: OpenId4VciCredentialRequestToCredentialMapperOptions): Promise<OpenId4VciSignSdJwtCredentials> => {
      const sessionId = args.issuanceSession.issuanceMetadata?.sessionId as string;
      
      if (!sessionId) {
        throw new Error('No session ID found in request');
      }

      const sessionData = this.sessionManager.getSession<IssuanceSessionData>(sessionId);
      if (!sessionData) {
        throw new Error('Session not found');
      }

      const credentialConfig = this.credentialConfigService.getCredentialById(sessionData.credentialId);
      if (!credentialConfig) {
        throw new Error('Credential configuration not found');
      }

      this.sessionManager.completeSession(sessionId);

      const issuerDid = await this.getOrCreateDid();
      const verificationMethod = await this.getVerificationMethodFromDid(issuerDid);

      const disclosureKeys = credentialConfig.fields.map(field =>
        Array.isArray(field.path) && field.path.length > 0
          ? field.path[field.path.length - 1].toString()
          : field.name
      );

      const result = await Promise.all(
        args.holderBinding.keys.map(async (binding: any): Promise<SdJwtVcSignOptions> => ({
          payload: {
            ...credentialConfig,
            vct: credentialConfig.credentialType,
            fields: sessionData.claims,
          },
          holder: binding,
          issuer: {
            method: 'did',
            didUrl: verificationMethod!,
          },
          disclosureFrame: {
            _sd: disclosureKeys,
          },
        }))
      );

      // Update issued credential status
      await this.credentialRepository.update(
        { transactionId: sessionId },
        { status: 'issued' }
      );

      return {
        credentials: result,
        format: ClaimFormat.SdJwtDc,
        type: 'credentials' as const,
      };
    };
  }

  private async initializeAgentActors(
    agent: Agent<AgentModules>,
    config: ReturnType<OpenId4VcConfigService['get']>
  ): Promise<{ issuerRecord?: OpenId4VcIssuerRecord; verifierRecord?: OpenId4VcVerifierRecord }> {
    const result: { issuerRecord?: OpenId4VcIssuerRecord; verifierRecord?: OpenId4VcVerifierRecord } = {};

    if (config.issuer.enabled) {
      const issuerApi = agent.modules.openid4vc.issuer;
      if (issuerApi) {
        const existingIssuers = await issuerApi.getAllIssuers();
        if (!existingIssuers || existingIssuers.length === 0) {
          result.issuerRecord = await this.initializeIssuer(agent);
        } else {
          result.issuerRecord = existingIssuers[0];
        }
      }
    }

    if (config.verifier.enabled) {
      const verifierApi = agent.modules.openid4vc.verifier;
      if (verifierApi) {
        const existingVerifiers = await verifierApi.getAllVerifiers();
        if (!existingVerifiers || existingVerifiers.length === 0) {
          result.verifierRecord = await this.initializeVerifier(agent);
        } else {
          result.verifierRecord = existingVerifiers[0];
        }
      }
    }

    return result;
  }

  private async initializeIssuer(agent: Agent<AgentModules>): Promise<OpenId4VcIssuerRecord> {
    const issuerApi = agent.modules.openid4vc.issuer;
    if (!issuerApi) {
      throw new Error('OpenID4VC issuer API not available');
    }

    const templates = await this.templateService.findAll();
    const config = templates.reduce((acc, template) => {
      const config = template.toOpenId4Vc();
      acc[template.id] = config;
      return acc;
    }, {} as OpenId4VciCredentialConfigurationsSupportedWithFormats);
    const issuerDisplayConfig = this.credentialConfigService.getIssuerConfig();
    const settings = this.credentialConfigService.getSettings();

    return await issuerApi.createIssuer({
      issuerId: this.credentialConfigService.getId(),
      display: [{
        name: issuerDisplayConfig.name,
        locale: 'en-US',
        ...(issuerDisplayConfig.logo && {
          logo: {
            uri: issuerDisplayConfig.logo,
            alt_text: `${issuerDisplayConfig.name} logo`,
          },
        }),
        description: issuerDisplayConfig.description,
        background_color: issuerDisplayConfig.primaryColor,
        text_color: issuerDisplayConfig.textColor,
      }],
      credentialConfigurationsSupported: config,
      batchCredentialIssuance: settings.allowBatchIssuance ? {
        batchSize: settings.maxBatchSize,
      } : undefined,
    });
  }

  private async initializeVerifier(agent: Agent<AgentModules>): Promise<OpenId4VcVerifierRecord> {
    const verifierApi = agent.modules.openid4vc.verifier;
    if (!verifierApi) {
      throw new Error('OpenID4VC verifier API not available');
    }

    return await verifierApi.createVerifier({
      verifierId: this.credentialConfigService.getId(),
    });
  }

  private async getOrCreateDid(): Promise<string> {
    const existingDid = this.credentialConfigService.getDid();
    if (existingDid) {
      return existingDid;
    }

    if (this.agentConfig.get().autoCreateDid) {
      const did = await this.createDid();
      await this.credentialConfigService.setDid(did);
      return did;
    }

    throw new Error('No issuer DID configured and auto-creation is disabled');
  }

  private async createDid(): Promise<string> {
    const agent = await this.getAgent();
    const didsConfig = this.didsConfig.get();

    const result = await agent.dids.create<HederaDidCreateOptions>({
      method: didsConfig.defaultMethod as 'hedera',
      options: {
        network: didsConfig.network
      },
    });

    if (result.didState.state === 'failed') {
      throw new Error(`Failed to create DID: ${result.didState.reason}`);
    }

    return result.didState.did!;
  }

  private async getVerificationMethodFromDid(did: string): Promise<string> {
    const agent = await this.getAgent();
    const result = await agent.dids.resolve(did);
    
    if (result?.didResolutionMetadata.error) {
      throw new Error(`Failed to resolve DID ${did}: ${result.didResolutionMetadata.error}`);
    }

    const verificationMethod = result?.didDocument?.verificationMethod?.[0];
    if (!verificationMethod) {
      throw new Error(`No verification method found for DID ${did}`);
    }

    return verificationMethod.id;
  }

  private async resetAgentStorage(agent: Agent<AgentModules>): Promise<void> {
    try {
      await agent.modules.askar.deleteStore();
      await agent.modules.askar.provisionStore();
    } catch (error) {
      console.warn('Failed to reset agent storage:', error);
    }
  }

  private mapLogLevel(level?: string): LogLevel {
    switch (level) {
      case 'trace': return LogLevel.trace;
      case 'debug': return LogLevel.debug;
      case 'info': return LogLevel.info;
      case 'warn': return LogLevel.warn;
      case 'error': return LogLevel.error;
      case 'fatal': return LogLevel.fatal;
      default: return LogLevel.info;
    }
  }

  async getAgent(): Promise<Agent<AgentModules>> {
    const credentials = await this.initialize();
    return credentials.agent;
  }

  async getIssuerApi() {
    const agent = await this.getAgent();
    return agent.modules.openid4vc.issuer;
  }

  async getVerifierApi() {
    const agent = await this.getAgent();
    return agent.modules.openid4vc.verifier;
  }

  async getIssuerRecord(): Promise<OpenId4VcIssuerRecord | undefined> {
    const credentials = await this.initialize();
    return credentials.issuerRecord;
  }

  async getVerifierRecord(): Promise<OpenId4VcVerifierRecord | undefined> {
    const credentials = await this.initialize();
    return credentials.verifierRecord;
  }

  async createCredentialOffer(options: CreateCredentialOfferOptions) {
    const issuerApi = await this.getIssuerApi();
    if (!issuerApi) {
      throw new Error('OpenID4VC issuer is not enabled');
    }

    const issuerRecord = await this.getIssuerRecord();
    if (!issuerRecord) {
      throw new Error('No issuer record found');
    }

    const sessionId = this.sessionManager.createIssuanceSession(
      options.credentialId,
      options.claims,
      options.holderDid
    );

    const result = await issuerApi.createCredentialOffer({
      issuerId: issuerRecord.issuerId,
      credentialConfigurationIds: [options.credentialId],
      preAuthorizedCodeFlowConfig: {
        txCode: {
          input_mode: 'numeric',
          length: 4,
          description: 'Accept credential offer',
        },
      },
      issuanceMetadata: {
        sessionId,
      },
    });

    if (!result) {
      throw new Error('Could not create credential offer');
    }

    return {
      offerData: result.credentialOffer,
      txCode: result.issuanceSession.userPin,
      sessionId,
    };
  }

  async createAuthorizationRequest(dcql: DcqlQuery) {
    const agent = await this.getAgent();
    const verifierApi = await this.getVerifierApi();
    
    if (!verifierApi) {
      throw new Error('OpenID4VC verifier is not enabled');
    }

    const verifierRecord = await this.getVerifierRecord();
    if (!verifierRecord) {
      throw new Error('No verifier record found');
    }

    const verifierDid = await this.getOrCreateDid();
    const verificationMethod = await this.getVerificationMethodFromDid(verifierDid);

    const request = await verifierApi.createAuthorizationRequest({
      verifierId: verifierRecord.verifierId,
      requestSigner: {
        method: 'did',
        didUrl: verificationMethod,
      },
      dcql: {
        query: dcql
      },
      responseMode: 'direct_post.jwt',
    });

    if (!request) {
      throw new Error('Could not create authorization request');
    }

    const sessionId = this.sessionManager.createVerificationSession(request.verificationSession.id);
    request.verificationSession.metadata.add(sessionId, { sessionId });

    return {
      requestData: request.authorizationRequest,
      requestId: request.verificationSession.id
    };
  }

  async getVerificationResponse(sessionId: string) {
    const verifiedResponse = await this.agentCredentials?.agent.openid4vc.verifier?.getVerifiedAuthorizationResponse(sessionId);
    return verifiedResponse;
  }

  async shutdown(): Promise<void> {
    if (this.agentCredentials?.agent) {
      await this.agentCredentials.agent.shutdown();
      this.agentCredentials = null;
    }
  }

  private shouldInitializeAgent(): boolean {
    const config = this.openId4VcConfig.get();
    return config.issuer.enabled || config.verifier.enabled;
  }

  get isInitialized(): boolean {
    return !!this.agentCredentials;
  }
}
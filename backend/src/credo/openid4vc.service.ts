// src/openid4vc/openid4vc.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Express } from 'express';
import { AppConfigService } from 'src/config/services/app-config.service';
import { OfferedCredentialsConfigService } from 'src/config/services/offered-credentials-config.service';
import { NetworkInfoService } from 'src/network-info/network-info.service';
import { SessionManagerService } from 'src/credo/session-manager.service';
import { AgentProvider } from './agent.provider';
import { DcqlQuery } from '@credo-ts/core';

@Injectable()
export class OpenId4VcService implements OnModuleDestroy, OnModuleInit {
  private expressApp: Express;

  constructor(
    private readonly configService: AppConfigService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly credentialConfigService: OfferedCredentialsConfigService,
    private readonly networkInfoService: NetworkInfoService,
    private readonly sessionManager: SessionManagerService,
    private readonly agentProvider: AgentProvider,
  ) {}

  async onModuleInit() {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    if (httpAdapter.getType() === 'express') {
      this.expressApp = httpAdapter.getInstance();
      // Agent is now initialized by AgentProvider
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
    return this.agentProvider.createCredentialOffer({
      credentialId,
      claims,
      holderDid,
      pinRequired: options?.pinRequired,
      pinLength: options?.pinLength,
    });
  }

  async createAuthorizationRequest(dcql: DcqlQuery) {
    return this.agentProvider.createAuthorizationRequest(dcql);
  }

  getAgent() {
    return this.agentProvider.getAgent();
  }

  getIssuer() {
    return this.agentProvider.getIssuerApi();
  }

  getVerifier() {
    return this.agentProvider.getVerifierApi();
  }

  async onModuleDestroy() {
    await this.agentProvider.shutdown();
  }
}
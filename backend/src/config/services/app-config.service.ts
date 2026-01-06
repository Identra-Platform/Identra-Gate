import { Injectable } from "@nestjs/common";
import { AgentConfig, AgentConfigService } from "./agent-config.service";
import { AuthConfig, AuthConfigService } from "./auth-config.service";
import { CredentialsConfig, CredentialsConfigService } from "./credentials-config.service";
import { DatabaseConfig, DatabaseConfigService } from "./database-config.service";
import { DidsConfig, DidsConfigService } from "./dids-config.service";
import { EmailConfig, EmailConfigService } from "./email-config.service";
import { LoggingConfig, LoggingConfigService } from "./logging-config.service";
import { OpenId4VcConfig, OpenId4VcConfigService } from "./openid4vc-config.service";
import { ServerConfig, ServerConfigService } from "./server-config.service";

export interface AppConfig {
  database: DatabaseConfig;
  auth: AuthConfig;
  server: ServerConfig;
  dids: DidsConfig;
  email: EmailConfig;
  logging: LoggingConfig;
  agent: AgentConfig;
  openId4Vc: OpenId4VcConfig;
  credentials: CredentialsConfig;
}

@Injectable()
export class AppConfigService {
  constructor(
    private readonly databaseConfig: DatabaseConfigService,
    private readonly authConfig: AuthConfigService,
    private readonly serverConfig: ServerConfigService,
    private readonly didsConfig: DidsConfigService,
    private readonly emailConfig: EmailConfigService,
    private readonly loggingConfig: LoggingConfigService,
    private readonly agentConfig: AgentConfigService,
    private readonly openId4VcConfig: OpenId4VcConfigService,
    private readonly credentialsConfig: CredentialsConfigService,
  ) {}

  get database(): DatabaseConfig {
    return this.databaseConfig.get();
  }

  get auth(): AuthConfig {
    return this.authConfig.get();
  }

  get server(): ServerConfig {
    return this.serverConfig.get();
  }

  get dids(): DidsConfig {
    return this.didsConfig.get();
  }

  get email(): EmailConfig {
    return this.emailConfig.get();
  }

  get logging(): LoggingConfig {
    return this.loggingConfig.get();
  }

  get agent(): AgentConfig {
    return this.agentConfig.get();
  }

  get openId4Vc(): OpenId4VcConfig {
    return this.openId4VcConfig.get();
  }

  get credentials(): CredentialsConfig {
    return this.credentialsConfig.get();
  }

  get isProduction(): boolean {
    return this.serverConfig.isProduction;
  }

  get isDevelopment(): boolean {
    return this.serverConfig.isDevelopment;
  }

  get isTest(): boolean {
    return this.serverConfig.isTest;
  }

  get isEmailEnabled(): boolean {
    return this.emailConfig.isEnabled;
  }

  get corsOrigins(): string[] {
    return this.server.corsOrigins;
  }

  get port(): number {
    return this.server.port;
  }

  get nodeEnv(): string {
    return this.server.nodeEnv;
  }

  get apiPrefix(): string {
    return this.server.apiPrefix || 'api';
  }

  isOpenId4VcIssuerEnabled(): boolean {
    return this.openId4Vc.issuer.enabled;
  }

  isOpenId4VcVerifierEnabled(): boolean {
    return this.openId4Vc.verifier.enabled;
  }

  isCredentialRevocationEnabled(): boolean {
    return this.credentials.revocation.enabled;
  }

  isBatchIssuanceEnabled(): boolean {
    return this.credentials.batch.enabled;
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate database connection
    if (!this.database.host || !this.database.database) {
      errors.push('Database configuration is incomplete');
    }

    // Validate JWT secrets
    if (this.isProduction) {
      if (this.auth.jwt.secret.length < 32) {
        errors.push('JWT secret is too short for production (minimum 32 characters)');
      }
      if (!this.server.trustProxy) {
        errors.push('Trust proxy should be enabled in production');
      }
    }

    // Validate email configuration if enabled
    if (this.email.enabled && !this.emailConfig.validateConnection()) {
      errors.push('Email configuration is invalid');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getTypeOrmConfig() {
    return this.databaseConfig.getTypeOrmConfig();
  }

  getCorsConfig() {
    return this.serverConfig.getCorsConfig();
  }

  getJwtConfig() {
    return this.authConfig.getJwtConfig();
  }

  getSessionConfig() {
    return this.authConfig.getSessionConfig();
  }

  getAskarConfig() {
    return this.agentConfig.getAskarConfig();
  }

  getWinstonConfig() {
    return this.loggingConfig.getWinstonConfig();
  }

  getOpenId4VcModuleConfig(baseUrl?: string) {
    return this.openId4VcConfig.getOpenId4VcModuleConfig(baseUrl);
  }

  getBaseUrl(): string {
    const protocol = this.isProduction ? 'https' : 'http';
    const host = this.server.frontendUrl.replace(/^https?:\/\//, '').split('/')[0];
    return `${protocol}://${host}`;
  }

  getApiBaseUrl(): string {
    return `${this.getBaseUrl()}/${this.apiPrefix}`;
  }

  reload(): void {
    // Note: Most config services are cached, so we would need to clear caches
    // This is a placeholder for potential future implementation
    console.log('Configuration reload requested');
  }

  getAll(): AppConfig {
    return {
      database: this.database,
      auth: this.auth,
      server: this.server,
      dids: this.dids,
      email: this.email,
      logging: this.logging,
      agent: this.agent,
      openId4Vc: this.openId4Vc,
      credentials: this.credentials,
    };
  }
}
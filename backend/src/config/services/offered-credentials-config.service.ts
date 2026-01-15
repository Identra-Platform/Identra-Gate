import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { OpenId4VciCredentialConfigurationsSupportedWithFormats, OpenId4VciCredentialConfigurationSupportedWithFormats } from '@credo-ts/openid4vc';
import { AppConfigService } from './app-config.service';
import { CredentialsConfigService } from './credentials-config.service';

export interface FieldConfig {
  name: string;
  path: (string | number)[];
  required: boolean;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'array' | 'object';
  description?: string;
  pattern?: string;
  min?: number;
  max?: number;
  options?: string[];
  default?: any;
}

export interface CredentialConfig {
  id: string;
  name: string;
  description: string;
  format: 'sd-jwt';
  credentialType?: string;
  credentialTypes?: string[];
  display: {
    icon: string;
    background: string;
    logo?: string;
    textColor?: string;
  };
  fields: FieldConfig[];
  active: boolean;
  tags: string[];
  validityDays?: number;
}

export interface IssuerConfig {
  name: string;
  logo?: string;
  description?: string;
  primaryColor: string;
  textColor: string;
  website?: string;
  contactEmail?: string;
}

export interface SettingsConfig {
  defaultValidityDays: number;
  allowBatchIssuance: boolean;
  maxBatchSize: number;
  supportedProofTypes: string[];
  supportedAlgorithms: string[];
  requireUserPIN: boolean;
  metadata: {
    termsOfService?: string;
    privacyPolicy?: string;
  };
}

export interface CredentialConfiguration {
  id: string;
  did?: string;
  version: string;
  lastUpdated: string;
  issuer: IssuerConfig;
  credentials: CredentialConfig[];
  settings: SettingsConfig;
}

@Injectable()
export class OfferedCredentialsConfigService {
  private config: CredentialConfiguration;
  private configPath: string;
  private autoReload: boolean;
  private watchForChanges: boolean;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly credentialsConfig: CredentialsConfigService
  ) {
    this.configPath = credentialsConfig.get().configPath;
    this.autoReload = credentialsConfig.get().autoReload;
    this.watchForChanges = credentialsConfig.get().watchForChanges;
    
    this.loadConfiguration();
    this.setupFileWatcher();
  }

  private setupFileWatcher() {
    if (this.watchForChanges) {
      try {
        fs.watch(this.configPath, (eventType) => {
          if (eventType === 'change') {
            console.log('Credential configuration file changed, reloading...');
            this.loadConfiguration();
          }
        });
      } catch (error) {
        console.warn('Could not setup file watcher for credential config:', error.message);
      }
    }
  }

  private loadConfiguration() {
    try {
      const configPath = path.resolve(process.cwd(), this.configPath);

      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');

        if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
          this.config = yaml.load(content) as CredentialConfiguration;
        } else {
          this.config = JSON.parse(content) as CredentialConfiguration;
        }
      } else {
        throw new Error(`Could not find credential configuration file at: ${configPath}`);
      }

      this.validateConfiguration();
      this.config.lastUpdated = new Date().toISOString();
    } catch (error) {
      throw new Error(`Could not load credential configuration: ${error.message}`);
    }
  }

  private validateConfiguration() {
    if (!this.config.id) throw new Error('Missing id in configuration');
    if (!this.config.version) throw new Error('Missing version in configuration');
    if (!this.config.issuer) throw new Error('Missing issuer configuration');
    if (!this.config.settings) throw new Error('Missing settings configuration');

    if (!this.config.did && !this.appConfig.agent.autoCreateDid) {
      throw new Error('System requires either DID or auto-create to be enabled');
    }
  }

  private async updateConfig() {
    try {
      const configPath = path.resolve(process.cwd(), this.configPath);

      this.config.lastUpdated = new Date().toISOString();

      let content: string;
      if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
        content = yaml.dump(this.config, {
          indent: 2,
        });
      } else {
        content = JSON.stringify(this.config, null, 2);
      }

      const tempPath = `${configPath}.tmp`;

      await fs.promises.writeFile(tempPath, content, 'utf8');

      await fs.promises.rename(tempPath, configPath);
    } catch (error) {
      throw new Error(`Failed to update credential configuration: ${error.message}`);
    }
  }

  getId(): string {
    return this.config.id;
  }

  getIssuerConfig(): IssuerConfig {
    return this.config.issuer;
  }

  getSettings(): SettingsConfig {
    return this.config.settings;
  }

  getDid(): string | undefined {
    return this.config.did;
  }

  async setDid(did: string) {
    this.config.did = did;
    await this.updateConfig();
  }

  reload(): void {
    this.loadConfiguration();
  }
}
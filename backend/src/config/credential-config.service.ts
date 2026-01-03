import { ConfigService } from './config.service';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Injectable } from '@nestjs/common';

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
  format: 'sd-jwt' | 'jwt' | 'json-ld';
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
  id: string;
  name: string;
  did?: string;
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
  version: string;
  lastUpdated: string;
  issuer: IssuerConfig;
  credentials: CredentialConfig[];
  settings: SettingsConfig;
}

@Injectable()
export class CredentialConfigService {
  private config: CredentialConfiguration;

  constructor(private readonly appConfig: ConfigService) {
    this.loadConfiguration();
  }

  private loadConfiguration() {
    try {
      const configPath = path.resolve(
        process.cwd(),
        this.appConfig.credentialConfig?.path || './credentials.json',
      );

      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');

        if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
          this.config = yaml.load(content) as CredentialConfiguration;
        } else {
          this.config = JSON.parse(content) as CredentialConfiguration;
        }
      } else throw new Error('Could not find credential configuration file');

      this.validateConfiguration();
    } catch (error) {
      throw new Error('Could not load configuration: ' + error);
    }
  }

  private validateConfiguration() {
    if (!this.config.version) throw new Error('Missing version in configuration');
    if (!this.config.issuer) throw new Error('Missing issuer configuration');
    if (!this.config.credentials) throw new Error('Missing credentials configuration');
    if (!this.config.settings) throw new Error('Missing settings configuration');
    if (!this.config.issuer.id) throw new Error('Missing id in configuration');

    for (const credential of this.config.credentials) {
      if (!credential.id) throw new Error(`Credential missing id`);
      if (!credential.name) throw new Error(`Credential ${credential.id} missing name`);
      if (!credential.format) throw new Error(`Credential ${credential.id} missing format`);
      
      if (credential.format === 'sd-jwt' && !credential.credentialType) {
        throw new Error(`SD-JWT credential ${credential.id} missing credentialType`);
      }
      
      if (credential.format === 'jwt' && !credential.credentialTypes) {
        throw new Error(`JWT credential ${credential.id} missing credentialTypes`);
      }
    }
  }

  private async updateConfig() {
    try {
      const configPath = path.resolve(
        process.cwd(),
        this.appConfig.credentialConfig?.path || './credentials.json',
      );

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

  convertToOpenId4VciFormat(): Record<string, any> {
    const credentialConfigurationsSupported: Record<string, any> = {};

    for (const credential of this.config.credentials){
      if (!credential.active) continue;

      const openIdConfig: any = {
        format: this.mapFormat(credential.format),
        credential_metadata: {
          display: [{
            name: credential.name,
            locale: 'en-US',
            description: credential.description,
            background_color: credential.display.background,
            text_color: credential.display.textColor || '#FFFFFF',
            ...(credential.display.logo && {
              logo: {
                uri: credential.display.logo,
                alt_text: `${credential.name} logo`
              }
            })
          }]
        }
      };

      if (credential.format === 'sd-jwt') {
        openIdConfig.vct = credential.credentialType;

        if (credential.fields && credential.fields.length > 0) {
          openIdConfig.credential_metadata.claims  = credential.fields.map(field => ({
            path: field.path,
            mandatory: field.required || false,
            display: [{
              name: field.name,
              locale: 'en-US',
              description: field.description
            }]
          }));
        }
      } else if (credential.format === 'jwt') {
        openIdConfig.types = credential.credentialTypes;
      }

      openIdConfig.cryptographic_binding_methods_supported = ['did', 'jwk'];
      openIdConfig.credential_signing_alg_values_supported = this.config.settings.supportedAlgorithms;

      credentialConfigurationsSupported[credential.id] = openIdConfig;
    }

    return credentialConfigurationsSupported;
  }

  private mapFormat(format: string): string {
    const formatMap = {
      'sd-jwt': 'dc+jwt-sd',
      'jwt': 'jwt_vc_json',
      'json-ld': 'ldp_vc'
    };
    return formatMap[format] || format;
  }

  getAllCredentials(): CredentialConfig[] {
    return this.config.credentials.filter(c => c.active);
  }

  getCredentialById(id: string): CredentialConfig | undefined {
    return this.config.credentials.find(c => c.id === id && c.active);
  }

  getIssuerConfig(): IssuerConfig {
    return this.config.issuer;
  }

  getSettings(): SettingsConfig {
    return this.config.settings;
  }

  getActiveCredentialIds(): string[] {
    return this.config.credentials
      .filter(c => c.active)
      .map(c => c.id);
  }

  getFieldConfig(credentialId: string, fieldPath: string): FieldConfig | undefined {
    const credential = this.getCredentialById(credentialId);
    if (!credential) return undefined;
    
    return credential.fields.find(field => 
      field.path.join('.') === fieldPath
    );
  }

  getIssuerDid(): string | undefined {
    return this.getIssuerConfig().did;
  }

  setIssuerDid(did: string) {
    this.config.issuer.did = did;
    this.updateConfig();
  }
}
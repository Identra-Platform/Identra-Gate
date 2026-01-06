import { Injectable } from "@nestjs/common";
import { BaseConfigService } from "./base-config.service";
import Joi from "joi";

export interface CredentialBatchConfig {
  enabled: boolean;
  maxBatchSize: number;
  defaultValidityDays: number;
}

export interface CredentialFormatConfig {
  sdJwt: {
    enabled: boolean;
  };
  jwt: {
    enabled: boolean;
    algorithm?: string;
  };
}

export interface CredentialValidationConfig {
  requireSchemaValidation: boolean;
  maxFieldLength?: number;
  allowedDataTypes?: string[];
}

export interface CredentialRevocationConfig {
  enabled: boolean;
  revocationListPath?: string;
}

export interface CredentialIssuanceConfig {
  defaultValidityDays: number;
  maxBulkIssue: number;
  requireHolderConsent: boolean;
  allowDeferredIssuance: boolean;
  deferredIssuanceTimeout: number;
}

export interface CredentialsConfig {
  batch: CredentialBatchConfig;
  formats: CredentialFormatConfig;
  validation: CredentialValidationConfig;
  revocation: CredentialRevocationConfig;
  issuance: CredentialIssuanceConfig;
  configPath: string;
  autoReload: boolean;
  watchForChanges: boolean;
  cacheTtl: number;
}

@Injectable()
export class CredentialsConfigService extends BaseConfigService<CredentialsConfig> {
  protected readonly prefix = 'CREDENTIAL_';
  protected readonly schema = Joi.object({
    // Batch Configuration
    CREDENTIAL_BATCH_ENABLED: Joi.boolean().default(false),
    CREDENTIAL_MAX_BATCH_SIZE: Joi.number().min(1).max(1000).default(100),
    CREDENTIAL_DEFAULT_VALIDITY_DAYS: Joi.number().min(1).default(365),
    
    // Format Configuration
    CREDENTIAL_SDJWT_ENABLED: Joi.boolean().default(true),
    CREDENTIAL_JWT_ENABLED: Joi.boolean().default(false),
    CREDENTIAL_JWT_ALGORITHM: Joi.string().default('ES256'),
    
    // Validation Configuration
    CREDENTIAL_REQUIRE_SCHEMA_VALIDATION: Joi.boolean().default(false),
    CREDENTIAL_MAX_FIELD_LENGTH: Joi.number().min(1).default(1000),
    CREDENTIAL_ALLOWED_DATA_TYPES: Joi.string().default('string,number,boolean,date,array,object'),
    
    // Revocation Configuration
    CREDENTIAL_REVOCATION_ENABLED: Joi.boolean().default(false),
    CREDENTIAL_REVOCATION_LIST_PATH: Joi.string().default('./data/revocation-list.json'),
    
    // Issuance Configuration
    CREDENTIAL_REQUIRE_HOLDER_CONSENT: Joi.boolean().default(true),
    CREDENTIAL_ALLOW_DEFERRED_ISSUANCE: Joi.boolean().default(false),
    CREDENTIAL_DEFERRED_ISSUANCE_TIMEOUT: Joi.number().min(300).default(3600), // 1 hour
    
    // General Configuration
    CREDENTIAL_CONFIG_PATH: Joi.string().default('./credentials.json'),
    CREDENTIAL_AUTO_RELOAD: Joi.boolean().default(process.env.NODE_ENV === 'development'),
    CREDENTIAL_WATCH_FOR_CHANGES: Joi.boolean().default(process.env.NODE_ENV === 'development'),
    CREDENTIAL_CACHE_TTL: Joi.number().min(0).default(300), // 5 minutes
  })
  .custom((value, helpers) => {
    // Validate that at least one format is enabled
    if (!value.CREDENTIAL_SDJWT_ENABLED && 
        !value.CREDENTIAL_JWT_ENABLED) {
      return helpers.error('any.invalid', {
        message: 'At least one credential format must be enabled',
      });
    }
    
    return value;
  });

  protected transform(validatedEnv: Record<string, any>): CredentialsConfig {
    const config = this.stripPrefix(validatedEnv);
    
    const allowedDataTypes = config.allowedDataTypes
      ? config.allowedDataTypes.split(',').map((type: string) => type.trim()).filter(Boolean)
      : ['string', 'number', 'boolean', 'date', 'array', 'object'];

    return {
      batch: {
        enabled: config.batchEnabled,
        maxBatchSize: config.maxBatchSize,
        defaultValidityDays: config.defaultValidityDays,
      },
      formats: {
        sdJwt: {
          enabled: config.sdjwtEnabled,
        },
        jwt: {
          enabled: config.jwtEnabled,
          algorithm: config.jwtAlgorithm,
        }
      },
      validation: {
        requireSchemaValidation: config.requireSchemaValidation,
        maxFieldLength: config.maxFieldLength,
        allowedDataTypes,
      },
      revocation: {
        enabled: config.revocationEnabled,
        revocationListPath: config.revocationListPath,
      },
      issuance: {
        defaultValidityDays: config.defaultValidityDays,
        maxBulkIssue: config.maxBatchSize,
        requireHolderConsent: config.requireHolderConsent,
        allowDeferredIssuance: config.allowDeferredIssuance,
        deferredIssuanceTimeout: config.deferredIssuanceTimeout,
      },
      configPath: config.configPath,
      autoReload: config.autoReload,
      watchForChanges: config.watchForChanges,
      cacheTtl: config.cacheTtl,
    };
  }

  getSupportedFormats(): string[] {
    const formats: string[] = [];
    const config = this.get().formats;
    
    if (config.sdJwt.enabled) formats.push('sd-jwt');
    if (config.jwt.enabled) formats.push('jwt');
    
    return formats;
  }

  isFormatEnabled(format: string): boolean {
    const config = this.get().formats;
    
    switch (format) {
      case 'sd-jwt':
        return config.sdJwt.enabled;
      case 'jwt':
        return config.jwt.enabled;
      default:
        return false;
    }
  }

  shouldAutoReload(): boolean {
    return this.get().autoReload;
  }

  getValidationRules() {
    const config = this.get().validation;
    return {
      maxFieldLength: config.maxFieldLength,
      allowedDataTypes: config.allowedDataTypes,
      requireSchemaValidation: config.requireSchemaValidation,
    };
  }

  getRevocationConfig() {
    const config = this.get().revocation;
    return {
      enabled: config.enabled,
      listPath: config.revocationListPath,
    };
  }

  getBatchConfig() {
    return this.get().batch;
  }

  getIssuanceConfig() {
    return this.get().issuance;
  }

  getCacheConfig() {
    return {
      ttl: this.get().cacheTtl,
      enabled: !this.shouldAutoReload(),
    };
  }
}
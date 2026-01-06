import { Injectable } from "@nestjs/common";
import { BaseConfigService } from "./base-config.service";
import Joi from "joi";

export interface OpenId4VcIssuerConfig {
  enabled: boolean;
  endpoint: string;
  baseUrl?: string;
  accessTokenExpiresInSeconds: number;
  credentialOfferExpiresInSeconds: number;
  userPinEnabled: boolean;
  userPinLength?: number;
  batchIssuanceEnabled: boolean;
  maxBatchSize?: number;
}

export interface OpenId4VcVerifierConfig {
  enabled: boolean;
  endpoint: string;
  baseUrl?: string;
  presentationRequestExpiresInSeconds: number;
  supportedAlgorithms: string[];
  responseMode?: 'direct_post.jwt' | 'query.jwt';
}

export interface OpenId4VcConfig {
  issuer: OpenId4VcIssuerConfig;
  verifier: OpenId4VcVerifierConfig;
  metadata?: {
    termsOfService?: string;
    privacyPolicy?: string;
    logoUrl?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  compliance?: {
    requireAudienceValidation: boolean;
    requireIssuerValidation: boolean;
    allowedIssuers?: string[];
    allowedAudiences?: string[];
  };
}

@Injectable()
export class OpenId4VcConfigService extends BaseConfigService<OpenId4VcConfig> {
  protected readonly prefix = 'OPENID4VC_';
  protected readonly schema = Joi.object({
    // Issuer Configuration
    OPENID4VC_ISSUER_ENABLED: Joi.boolean().default(false),
    OPENID4VC_ISSUER_ENDPOINT: Joi.string().when('OPENID4VC_ISSUER_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.allow('').optional(),
    }),
    OPENID4VC_ISSUER_BASE_URL: Joi.string().uri().allow('').optional(),
    OPENID4VC_ACCESS_TOKEN_EXPIRES_IN: Joi.number().min(60).default(300), // 5 minutes
    OPENID4VC_CREDENTIAL_OFFER_EXPIRES_IN: Joi.number().min(300).default(3600), // 1 hour
    OPENID4VC_USER_PIN_ENABLED: Joi.boolean().default(true),
    OPENID4VC_USER_PIN_LENGTH: Joi.number().min(4).max(8).default(4),
    OPENID4VC_BATCH_ISSUANCE_ENABLED: Joi.boolean().default(false),
    OPENID4VC_MAX_BATCH_SIZE: Joi.number().min(1).max(100).default(10),
    
    // Verifier Configuration
    OPENID4VC_VERIFIER_ENABLED: Joi.boolean().default(false),
    OPENID4VC_VERIFIER_ENDPOINT: Joi.string().when('OPENID4VC_VERIFIER_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.allow('').optional(),
    }),
    OPENID4VC_VERIFIER_BASE_URL: Joi.string().uri().allow('').optional(),
    OPENID4VC_PRESENTATION_REQUEST_EXPIRES_IN: Joi.number().min(300).default(600), // 10 minutes
    OPENID4VC_SUPPORTED_ALGORITHMS: Joi.string().default('ES256,EdDSA'),
    OPENID4VC_RESPONSE_MODE: Joi.string()
      .valid('direct_post.jwt', 'query.jwt')
      .default('direct_post.jwt'),
    
    // Metadata
    OPENID4VC_METADATA_TERMS_OF_SERVICE: Joi.string().uri().allow('').optional(),
    OPENID4VC_METADATA_PRIVACY_POLICY: Joi.string().uri().allow('').optional(),
    OPENID4VC_METADATA_LOGO_URL: Joi.string().uri().allow('').optional(),
    OPENID4VC_METADATA_BACKGROUND_COLOR: Joi.string().default('#0066CC'),
    OPENID4VC_METADATA_TEXT_COLOR: Joi.string().default('#FFFFFF'),
    
    // Compliance
    OPENID4VC_COMPLIANCE_REQUIRE_AUDIENCE_VALIDATION: Joi.boolean().default(true),
    OPENID4VC_COMPLIANCE_REQUIRE_ISSUER_VALIDATION: Joi.boolean().default(true),
    OPENID4VC_COMPLIANCE_ALLOWED_ISSUERS: Joi.string().allow('').optional(),
    OPENID4VC_COMPLIANCE_ALLOWED_AUDIENCES: Joi.string().allow('').optional(),
  })
  .custom((value, helpers) => {
    // Convert all empty strings to undefined
    Object.keys(value).forEach(key => {
      if (typeof value[key] === 'string' && value[key].trim() === '') {
        value[key] = undefined;
      }
    });
    return value;
  })
  .custom((value, helpers) => {
    // Validate batch issuance configuration
    if (value.OPENID4VC_BATCH_ISSUANCE_ENABLED && value.OPENID4VC_MAX_BATCH_SIZE > 100) {
      return helpers.error('any.invalid', {
        message: 'OPENID4VC_MAX_BATCH_SIZE cannot exceed 100',
      });
    }
    
    return value;
  });

  protected transform(validatedEnv: Record<string, any>): OpenId4VcConfig {
    const config = this.stripPrefix(validatedEnv);
    
    const supportedAlgorithms = config.supportedAlgorithms
      ? config.supportedAlgorithms.split(',').map((alg: string) => alg.trim()).filter(Boolean)
      : ['ES256', 'EdDSA'];
    
    const allowedIssuers = config.complianceAllowedIssuers
      ? config.complianceAllowedIssuers.split(',').map((issuer: string) => issuer.trim()).filter(Boolean)
      : undefined;
    
    const allowedAudiences = config.complianceAllowedAudiences
      ? config.complianceAllowedAudiences.split(',').map((audience: string) => audience.trim()).filter(Boolean)
      : undefined;

    return {
      issuer: {
        enabled: config.issuerEnabled,
        endpoint: config.issuerEndpoint,
        baseUrl: config.issuerBaseUrl,
        accessTokenExpiresInSeconds: config.accessTokenExpiresIn,
        credentialOfferExpiresInSeconds: config.credentialOfferExpiresIn,
        userPinEnabled: config.userPinEnabled,
        userPinLength: config.userPinLength,
        batchIssuanceEnabled: config.batchIssuanceEnabled,
        maxBatchSize: config.maxBatchSize,
      },
      verifier: {
        enabled: config.verifierEnabled,
        endpoint: config.verifierEndpoint,
        baseUrl: config.verifierBaseUrl,
        presentationRequestExpiresInSeconds: config.presentationRequestExpiresIn,
        supportedAlgorithms,
        responseMode: config.responseMode,
      },
      metadata: {
        termsOfService: config.metadataTermsOfService,
        privacyPolicy: config.metadataPrivacyPolicy,
        logoUrl: config.metadataLogoUrl,
        backgroundColor: config.metadataBackgroundColor,
        textColor: config.metadataTextColor,
      },
      compliance: {
        requireAudienceValidation: config.complianceRequireAudienceValidation,
        requireIssuerValidation: config.complianceRequireIssuerValidation,
        allowedIssuers,
        allowedAudiences,
      },
    };
  }

  getIssuerBaseUrl(baseUrl?: string): string {
    const config = this.get();
    if (config.issuer.baseUrl) {
      return config.issuer.baseUrl;
    }
    return baseUrl || `http://localhost:${process.env.PORT || 3000}`;
  }

  getVerifierBaseUrl(baseUrl?: string): string {
    const config = this.get();
    if (config.verifier.baseUrl) {
      return config.verifier.baseUrl;
    }
    return baseUrl || `http://localhost:${process.env.PORT || 3000}`;
  }

  getIssuerFullEndpoint(baseUrl?: string): string {
    const config = this.get();
    const base = this.getIssuerBaseUrl(baseUrl);
    return `${base}${config.issuer.endpoint}`;
  }

  getVerifierFullEndpoint(baseUrl?: string): string {
    const config = this.get();
    const base = this.getVerifierBaseUrl(baseUrl);
    return `${base}${config.verifier.endpoint}`;
  }

  getOpenId4VcModuleConfig(baseUrl?: string) {
    const config = this.get();
    
    const moduleConfig: any = {};
    
    if (config.issuer.enabled) {
      moduleConfig.issuer = {
        baseUrl: this.getIssuerFullEndpoint(baseUrl),
        accessTokenExpiresInSeconds: config.issuer.accessTokenExpiresInSeconds,
        credentialOfferExpiresInSeconds: config.issuer.credentialOfferExpiresInSeconds,
      };
    }
    
    if (config.verifier.enabled) {
      moduleConfig.verifier = {
        baseUrl: this.getVerifierFullEndpoint(baseUrl),
      };
    }
    
    return moduleConfig;
  }

  getSupportedAlgorithms(): string[] {
    return this.get().verifier.supportedAlgorithms;
  }

  getIssuerMetadata() {
    const config = this.get();
    return config.metadata;
  }

  getComplianceConfig() {
    return this.get().compliance;
  }
}
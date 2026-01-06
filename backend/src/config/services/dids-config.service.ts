import { Injectable } from "@nestjs/common";
import Joi, { string } from "joi";
import { BaseConfigService } from "./base-config.service";

export interface DidMethodConfig {
  enabled: boolean;
  options?: Record<string, any>;
}

export interface DidsConfig {
  allowedMethods: string[];
  defaultMethod: string;
  verificationTimeout: number;
  cacheTtl?: number;
  resolverUrl?: string;
  universalResolverUrl?: string;
  didMethods: Record<string, DidMethodConfig>;
  network?: string;
  registryAddress?: string;
}

@Injectable()
export class DidsConfigService extends BaseConfigService<DidsConfig> {
  protected readonly prefix = 'DID_';
  protected readonly schema = Joi.object({
    DID_ALLOWED_METHODS: Joi.string().default('key,web,ethr,hedera'),
    DID_DEFAULT_METHOD: Joi.string().default('key'),
    DID_VERIFICATION_TIMEOUT: Joi.number().min(1000).default(10000),
    DID_CACHE_TTL: Joi.number().min(0).default(300), // 5 minutes in seconds
    DID_RESOLVER_URL: Joi.string().uri().allow('').optional(),
    DID_UNIVERSAL_RESOLVER_URL: Joi.string().uri().default('https://dev.uniresolver.io'),
    DID_HEDERA_NETWORK: Joi.string().valid('testnet', 'previewnet', 'mainnet').default('testnet'),
    DID_HEDERA_REGISTRY_ADDRESS: Joi.string().allow('').optional(),
    DID_ETHR_NETWORK: Joi.string().default('mainnet'),
    DID_ETHR_REGISTRY_ADDRESS: Joi.string().allow('').optional(),
    DID_WEB_DOMAIN: Joi.string().when('DID_DEFAULT_METHOD', {
      is: 'web',
      then: Joi.required(),
      otherwise: Joi.allow('').optional(),
    }),
  });

  protected transform(validatedEnv: Record<string, any>): DidsConfig {
    const allowedMethods = validatedEnv.DID_ALLOWED_METHODS
      ? validatedEnv.DID_ALLOWED_METHODS.split(',')
          .map((method: string) => method.trim())
          .filter(Boolean)
      : ['key', 'web'];

    const didMethods: Record<string, DidMethodConfig> = {
      key: { enabled: allowedMethods.includes('key') },
      web: { 
        enabled: allowedMethods.includes('web'),
        options: {
          domain: validatedEnv.DID_WEB_DOMAIN,
        }
      },
      hedera: {
        enabled: allowedMethods.includes('hedera'),
        options: {
          network: validatedEnv.DID_HEDERA_NETWORK,
          registryAddress: validatedEnv.DID_HEDERA_REGISTRY_ADDRESS,
        }
      },
      ethr: {
        enabled: allowedMethods.includes('ethr'),
        options: {
          network: validatedEnv.DID_ETHR_NETWORK,
          registryAddress: validatedEnv.DID_ETHR_REGISTRY_ADDRESS,
        }
      }
    };

    return {
      allowedMethods,
      defaultMethod: validatedEnv.DID_DEFAULT_METHOD,
      verificationTimeout: validatedEnv.DID_VERIFICATION_TIMEOUT,
      cacheTtl: validatedEnv.DID_CACHE_TTL,
      resolverUrl: validatedEnv.DID_RESOLVER_URL,
      universalResolverUrl: validatedEnv.DID_UNIVERSAL_RESOLVER_URL,
      didMethods,
      network: validatedEnv.DID_HEDERA_NETWORK,
      registryAddress: validatedEnv.DID_HEDERA_REGISTRY_ADDRESS,
    };
  }

  isMethodEnabled(method: string): boolean {
    return this.get().didMethods[method]?.enabled || false;
  }

  getMethodOptions(method: string): Record<string, any> | undefined {
    return this.get().didMethods[method]?.options;
  }

  validateMethod(method: string): void {
    const config = this.get();
    if (!config.allowedMethods.includes(method)) {
      throw new Error(`DID method "${method}" is not allowed. Allowed methods: ${config.allowedMethods.join(', ')}`);
    }
  }

  getResolverConfig() {
    const config = this.get();
    return {
      timeout: config.verificationTimeout,
      cacheTtl: config.cacheTtl,
      resolverUrl: config.resolverUrl,
      universalResolverUrl: config.universalResolverUrl,
    };
  }

  getHederaConfig() {
    const methodConfig = this.getMethodOptions('hedera');
    return methodConfig || {};
  }
}
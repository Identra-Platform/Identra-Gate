import { Injectable } from "@nestjs/common";
import { BaseConfigService } from "./base-config.service";
import Joi from "joi";

export type NodeEnv = 'development' | 'production' | 'test';

export interface ServerConfig {
  port: number;
  nodeEnv: NodeEnv;
  frontendUrl: string;
  corsOrigins: string[];
  apiPrefix?: string;
  bodyLimit?: string;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  shutdownTimeout?: number;
  trustProxy?: boolean;
}

@Injectable()
export class ServerConfigService extends BaseConfigService<ServerConfig> {
  protected readonly prefix = '';
  protected readonly schema = Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().port().default(3000),
    FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
    CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
    API_PREFIX: Joi.string().default('api'),
    BODY_LIMIT: Joi.string().default('10mb'),
    RATE_LIMIT_WINDOW_MS: Joi.number().min(1000).default(60000), // 1 minute
    RATE_LIMIT_MAX_REQUESTS: Joi.number().min(1).default(100),
    SHUTDOWN_TIMEOUT: Joi.number().min(1000).default(10000), // 10 seconds
    TRUST_PROXY: Joi.boolean().default(false),
  });

  protected transform(validatedEnv: Record<string, any>): ServerConfig {
    const corsOrigins = validatedEnv.CORS_ORIGINS
      ? validatedEnv.CORS_ORIGINS.split(',')
          .map((origin: string) => origin.trim())
          .filter(Boolean)
      : ['http://localhost:5173'];

    return {
      port: validatedEnv.PORT,
      nodeEnv: validatedEnv.NODE_ENV,
      frontendUrl: validatedEnv.FRONTEND_URL,
      corsOrigins,
      apiPrefix: validatedEnv.API_PREFIX,
      bodyLimit: validatedEnv.BODY_LIMIT,
      rateLimit: {
        windowMs: validatedEnv.RATE_LIMIT_WINDOW_MS,
        maxRequests: validatedEnv.RATE_LIMIT_MAX_REQUESTS,
      },
      shutdownTimeout: validatedEnv.SHUTDOWN_TIMEOUT,
      trustProxy: validatedEnv.TRUST_PROXY,
    };
  }

  get isDevelopment(): boolean {
    return this.get().nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.get().nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.get().nodeEnv === 'test';
  }

  getCorsConfig() {
    const config = this.get();
    return {
      origin: config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    };
  }

  getApiPath(path: string = ''): string {
    const prefix = this.get().apiPrefix || 'api';
    return `/${prefix}/${path.replace(/^\//, '')}`;
  }

  shouldTrustProxy(): boolean {
    return this.get().trustProxy || this.isProduction;
  }
}
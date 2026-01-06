import { Injectable } from "@nestjs/common";
import { BaseConfigService } from "./base-config.service";
import Joi from "joi";

export interface EmailAuthConfig {
  user: string;
  pass: string;
}

export interface EmailConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  auth: EmailAuthConfig;
  from: string;
  fromName?: string;
  templatesPath: string;
  queueEnabled?: boolean;
  queueName?: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

@Injectable()
export class EmailConfigService extends BaseConfigService<EmailConfig> {
  protected readonly prefix = 'EMAIL_';
  protected readonly schema = Joi.object({
    EMAIL_ENABLED: Joi.boolean().default(false),
    EMAIL_HOST: Joi.string().when('EMAIL_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.allow('').optional(),
    }),
    EMAIL_PORT: Joi.number()
      .port()
      .when('EMAIL_ENABLED', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.allow('').optional(),
      }),
    EMAIL_SECURE: Joi.boolean().default(true),
    EMAIL_USER: Joi.string().when('EMAIL_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.allow('').optional(),
    }),
    EMAIL_PASSWORD: Joi.string().when('EMAIL_ENABLED', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.allow('').optional(),
    }),
    EMAIL_FROM: Joi.string().email().default('noreply@example.com'),
    EMAIL_FROM_NAME: Joi.string().allow('').optional(),
    EMAIL_TEMPLATES_PATH: Joi.string().default('./templates/email'),
    EMAIL_QUEUE_ENABLED: Joi.boolean().default(true),
    EMAIL_QUEUE_NAME: Joi.string().default('email-queue'),
    EMAIL_RETRY_ATTEMPTS: Joi.number().min(0).default(3),
    EMAIL_RETRY_DELAY: Joi.number().min(100).default(5000), // 5 seconds
    EMAIL_TIMEOUT: Joi.number().min(1000).default(10000), // 10 seconds
  })
  .custom((value, helpers) => {
    if (value.EMAIL_ENABLED === true) {
      const requiredFields = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
      const missingFields = requiredFields.filter(field => !value[field]);
      
      if (missingFields.length > 0) {
        return helpers.error('any.required', {
          message: `Missing required email configuration: ${missingFields.join(', ')}`,
        });
      }
    }
    return value;
  });

  protected transform(validatedEnv: Record<string, any>): EmailConfig {
    const config = this.stripPrefix(validatedEnv);
    
    return {
      enabled: config.enabled,
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
      from: config.from,
      fromName: config.fromName,
      templatesPath: config.templatesPath,
      queueEnabled: config.queueEnabled,
      queueName: config.queueName,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      timeout: config.timeout,
    };
  }

  get isEnabled(): boolean {
    return this.get().enabled;
  }

  getTransporterConfig() {
    const config = this.get();
    if (!config.enabled) {
      throw new Error('Email service is not enabled');
    }

    return {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      pool: config.queueEnabled,
      maxConnections: config.queueEnabled ? 5 : 1,
      tls: {
        rejectUnauthorized: config.secure,
      },
    };
  }

  getQueueConfig() {
    const config = this.get();
    return {
      enabled: config.queueEnabled,
      name: config.queueName,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      timeout: config.timeout,
    };
  }

  getFullFromAddress(): string {
    const config = this.get();
    if (config.fromName) {
      return `"${config.fromName}" <${config.from}>`;
    }
    return config.from;
  }

  validateConnection(): boolean {
    const config = this.get();
    return config.enabled && 
           !!config.host && 
           !!config.port && 
           !!config.auth.user && 
           !!config.auth.pass;
  }
}
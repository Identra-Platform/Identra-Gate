import { Injectable } from '@nestjs/common';
import path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
  bcryptRounds: number;
}

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  frontendUrl: string;
  corsOrigins: string[];
}

export interface SetupConfig {
  requireInitialSetup: boolean;
  setupFlagPath: string;
  minPasswordLength: number;
  recoveryPhraseWords: number;
  allowSetupReset: boolean;
}

export interface CredentialsConfig {
  defaultValidityDays: number;
  maxBulkIssue: number;
}

export interface DIDsConfig {
  allowedMethods: string[];
  defaultMethod: string;
  verificationTimeout: number;
}

export interface EmailConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  templatesPath: string;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  filePath: string;
  maxSize: string;
  maxFiles: string;
}


export interface AppConfig {
  database: DatabaseConfig;
  auth: AuthConfig;
  server: ServerConfig;
  setup: SetupConfig;
  credentials: CredentialsConfig;
  dids: DIDsConfig;
  email: EmailConfig;
  logging: LoggingConfig;
}

@Injectable()
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    const env = this.loadEnviroment();
    this.config = this.validateAndBuildConfig(env);
  }

  private loadEnviroment(): NodeJS.ProcessEnv {
    const envPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`);
    const defaultEnvPath = path.resolve(process.cwd(), '.env');

    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    } else if (fs.existsSync(defaultEnvPath)) {
      dotenv.config({ path: defaultEnvPath });
    }

    return process.env;
  }

  private validateAndBuildConfig(env: NodeJS.ProcessEnv): AppConfig {
    const envSchema = Joi.object({
      DB_HOST: Joi.string().default('localhost'),
      DB_PORT: Joi.number().port().default(5432),
      DB_DATABASE: Joi.string().required(),
      DB_USERNAME: Joi.string().required(),
      DB_PASSWORD: Joi.string().required(),
      DB_SSL: Joi.boolean().default(false),

      JWT_SECRET: Joi.string().min(32).required(),
      JWT_EXPIRES_IN: Joi.string().default('1h'),
      REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
      REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
      BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),

      NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      PORT: Joi.number().port().default(3000),
      FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
      CORS_ORIGINS: Joi.string().default('http://localhost:5173'),

      REQUIRE_INITIAL_SETUP: Joi.boolean().default(true),
      SETUP_FLAG_PATH: Joi.string().default('./data/setup-completed.flag'),
      MIN_PASSWORD_LENGTH: Joi.number().min(8).default(12),
      RECOVERY_PHRASE_WORDS: Joi.number().min(12).max(24).default(24),
      ALLOW_SETUP_RESET: Joi.boolean().default(true),

      DEFAULT_VALIDITY_DAYS: Joi.number().min(1).default(365),
      MAX_BULK_ISSUE: Joi.number().min(1).max(1000).default(100),

      ALLOWED_DID_METHODS: Joi.string().default('key,web,ethr'),
      DEFAULT_DID_METHOD: Joi.string().default('key'),
      VERIFICATION_TIMEOUT: Joi.number().min(1000).default(10000),

      EMAIL_ENABLED: Joi.boolean().default(false),
      EMAIL_HOST: Joi.string().when('EMAIL_ENABLED', { is: true, then: Joi.required() }),
      EMAIL_PORT: Joi.number().port().when('EMAIL_ENABLED', { is: true, then: Joi.required() }),
      EMAIL_SECURE: Joi.boolean().default(true),
      EMAIL_USER: Joi.string().when('EMAIL_ENABLED', { is: true, then: Joi.required() }),
      EMAIL_PASSWORD: Joi.string().when('EMAIL_ENABLED', { is: true, then: Joi.required() }),
      EMAIL_FROM: Joi.string().email().default('noreply@example.com'),
      EMAIL_TEMPLATES_PATH: Joi.string().default('./templates/email'),

      LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
      LOG_FILE_PATH: Joi.string().default('./logs'),
      LOG_MAX_SIZE: Joi.string().default('10m'),
      LOG_MAX_FILES: Joi.string().default('30d')
    })
    .unknown(true)
    .custom((value, helpers) => {
      if (value.NODE_ENV === 'production' && value.JWT_SECRET.length < 32) {
        return helpers.error('any.invalid', {
          message: 'JWT_SECRET must be at least 32 characters in production',
        })
      }
      return value;
    });

    const { error, value: validatedEnv } = envSchema.validate(env, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      throw new Error(`Configuration validation failed: ${errorMessages}`);
    }

    const corsOrigins = validatedEnv.CORS_ORIGINS.split(',').map(s => s.trim());
    const allowedFileTypes = validatedEnv.ALLOWED_FILE_TYPES.split(',').map(s => s.trim());
    const allowedDidMethods = validatedEnv.ALLOWED_DID_METHODS.split(',').map(s => s.trim());

    return {
      database: {
        host: validatedEnv.DB_HOST,
        port: validatedEnv.DB_PORT,
        database: validatedEnv.DB_DATABASE,
        username: validatedEnv.DB_USERNAME,
        password: validatedEnv.DB_PASSWORD,
        ssl: validatedEnv.DB_SSL,
      },
      auth: {
        jwtSecret: validatedEnv.JWT_SECRET,
        jwtExpiresIn: validatedEnv.JWT_EXPIRES_IN,
        refreshTokenSecret: validatedEnv.REFRESH_TOKEN_SECRET,
        refreshTokenExpiresIn: validatedEnv.REFRESH_TOKEN_EXPIRES_IN,
        bcryptRounds: validatedEnv.BCRYPT_ROUNDS,
      },
      server: {
        port: validatedEnv.PORT,
        nodeEnv: validatedEnv.NODE_ENV,
        frontendUrl: validatedEnv.FRONTEND_URL,
        corsOrigins,
      },
      setup: {
        requireInitialSetup: validatedEnv.REQUIRE_INITIAL_SETUP,
        setupFlagPath: validatedEnv.SETUP_FLAG_PATH,
        minPasswordLength: validatedEnv.MIN_PASSWORD_LENGTH,
        recoveryPhraseWords: validatedEnv.RECOVERY_PHRASE_WORDS,
        allowSetupReset: validatedEnv.ALLOW_SETUP_RESET,
      },
      credentials: {
        defaultValidityDays: validatedEnv.DEFAULT_VALIDITY_DAYS,
        maxBulkIssue: validatedEnv.MAX_BULK_ISSUE,
      },
      dids: {
        allowedMethods: allowedDidMethods,
        defaultMethod: validatedEnv.DEFAULT_DID_METHOD,
        verificationTimeout: validatedEnv.VERIFICATION_TIMEOUT,
      },
      email: {
        enabled: validatedEnv.EMAIL_ENABLED,
        host: validatedEnv.EMAIL_HOST,
        port: validatedEnv.EMAIL_PORT,
        secure: validatedEnv.EMAIL_SECURE,
        auth: {
          user: validatedEnv.EMAIL_USER,
          pass: validatedEnv.EMAIL_PASSWORD,
        },
        from: validatedEnv.EMAIL_FROM,
        templatesPath: validatedEnv.EMAIL_TEMPLATES_PATH,
      },
      logging: {
        level: validatedEnv.LOG_LEVEL,
        filePath: validatedEnv.LOG_FILE_PATH,
        maxSize: validatedEnv.LOG_MAX_SIZE,
        maxFiles: validatedEnv.LOG_MAX_FILES,
      },
    };
  }

  get database(): DatabaseConfig {
    return this.config.database;
  }

  get auth(): AuthConfig {
    return this.config.auth;
  }

  get server(): ServerConfig {
    return this.config.server;
  }

  get setup(): SetupConfig {
    return this.config.setup;
  }

  get credentials(): CredentialsConfig {
    return this.config.credentials;
  }

  get dids(): DIDsConfig {
    return this.config.dids;
  }

  get email(): EmailConfig {
    return this.config.email;
  }

  get logging(): LoggingConfig {
    return this.config.logging;
  }

  get all(): AppConfig {
    return this.config;
  }

  get isProduction(): boolean {
    return this.config.server.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.config.server.nodeEnv === 'development';
  }

  get isEmailEnabled(): boolean {
    return this.config.email.enabled;
  }

  get corsOrigins(): string[] {
    return this.config.server.corsOrigins;
  }
}

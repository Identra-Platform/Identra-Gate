import { Injectable } from "@nestjs/common";
import { BaseConfigService } from "./base-config.service";
import Joi from "joi";

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';
export type LogFormat = 'json' | 'simple' | 'pretty';

export interface LogRotationConfig {
  maxSize: string;
  maxFiles: string;
  compress: boolean;
  maxAge?: string;
}

export interface LogFileConfig {
  enabled: boolean;
  path: string;
  filename?: string;
  level?: LogLevel;
  format?: LogFormat;
  rotation?: LogRotationConfig;
}

export interface LogConsoleConfig {
  enabled: boolean;
  level: LogLevel;
  format: LogFormat;
  colors?: boolean;
}

export interface LogExternalConfig {
  enabled: boolean;
  service?: 'sentry' | 'datadog' | 'newrelic' | 'logstash';
  dsn?: string;
  level?: LogLevel;
  sampleRate?: number;
  environment?: string;
}

export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
  file: LogFileConfig;
  console: LogConsoleConfig;
  external: LogExternalConfig;
  correlationIdHeader?: string;
  redactFields?: string[];
  enableMetrics?: boolean;
  slowQueryThreshold?: number;
}

@Injectable()
export class LoggingConfigService extends BaseConfigService<LoggingConfig> {
  protected readonly prefix = 'LOG_';
  protected readonly schema = Joi.object({
    LOG_LEVEL: Joi.string()
      .valid('error', 'warn', 'info', 'debug', 'verbose')
      .default('info'),
    LOG_FORMAT: Joi.string()
      .valid('json', 'simple', 'pretty')
      .default('json'),
    
    // File logging
    LOG_FILE_ENABLED: Joi.boolean().default(true),
    LOG_FILE_PATH: Joi.string().default('./logs'),
    LOG_FILE_FILENAME: Joi.string().default('app-%DATE%.log'),
    LOG_FILE_LEVEL: Joi.string()
      .valid('error', 'warn', 'info', 'debug', 'verbose')
      .default('info'),
    LOG_FILE_FORMAT: Joi.string()
      .valid('json', 'simple', 'pretty')
      .default('json'),
    LOG_MAX_SIZE: Joi.string().default('10m'),
    LOG_MAX_FILES: Joi.string().default('30d'),
    LOG_COMPRESS: Joi.boolean().default(true),
    LOG_MAX_AGE: Joi.string().allow('').optional(),
    
    // Console logging
    LOG_CONSOLE_ENABLED: Joi.boolean().default(true),
    LOG_CONSOLE_LEVEL: Joi.string()
      .valid('error', 'warn', 'info', 'debug', 'verbose')
      .default(process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    LOG_CONSOLE_FORMAT: Joi.string()
      .valid('json', 'simple', 'pretty')
      .default(process.env.NODE_ENV === 'production' ? 'json' : 'pretty'),
    LOG_CONSOLE_COLORS: Joi.boolean().default(process.env.NODE_ENV !== 'production'),
    
    // External logging
    LOG_EXTERNAL_ENABLED: Joi.boolean().default(false),
    LOG_EXTERNAL_SERVICE: Joi.string()
      .valid('sentry', 'datadog', 'newrelic', 'logstash')
      .allow('').optional(),
    LOG_EXTERNAL_DSN: Joi.string().uri().allow('').optional(),
    LOG_EXTERNAL_LEVEL: Joi.string()
      .valid('error', 'warn', 'info', 'debug', 'verbose')
      .default('error'),
    LOG_EXTERNAL_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),
    LOG_EXTERNAL_ENVIRONMENT: Joi.string().default(process.env.NODE_ENV || 'development'),
    
    // Advanced
    LOG_CORRELATION_ID_HEADER: Joi.string().default('x-correlation-id'),
    LOG_REDACT_FIELDS: Joi.string().default('password,secret,token,authorization'),
    LOG_ENABLE_METRICS: Joi.boolean().default(true),
    LOG_SLOW_QUERY_THRESHOLD: Joi.number().min(0).default(5000), // 5 seconds
  });

  protected transform(validatedEnv: Record<string, any>): LoggingConfig {
    const config = this.stripPrefix(validatedEnv);
    
    const redactFields = config.redactFields
      ? config.redactFields.split(',').map((field: string) => field.trim()).filter(Boolean)
      : ['password', 'secret', 'token', 'authorization'];

    return {
      level: config.level,
      format: config.format,
      file: {
        enabled: config.fileEnabled,
        path: config.filePath,
        filename: config.fileFilename,
        level: config.fileLevel,
        format: config.fileFormat,
        rotation: {
          maxSize: config.maxSize,
          maxFiles: config.maxFiles,
          compress: config.compress,
          maxAge: config.maxAge,
        },
      },
      console: {
        enabled: config.consoleEnabled,
        level: config.consoleLevel,
        format: config.consoleFormat,
        colors: config.consoleColors,
      },
      external: {
        enabled: config.externalEnabled,
        service: config.externalService,
        dsn: config.externalDsn,
        level: config.externalLevel,
        sampleRate: config.externalSampleRate,
        environment: config.externalEnvironment,
      },
      correlationIdHeader: config.correlationIdHeader,
      redactFields,
      enableMetrics: config.enableMetrics,
      slowQueryThreshold: config.slowQueryThreshold,
    };
  }

  getWinstonConfig() {
    const config = this.get();
    
    const transports: any = [];
    
    if (config.console.enabled) {
      transports.push({
        type: 'console',
        level: config.console.level,
        format: config.console.format,
        colors: config.console.colors,
      });
    }
    
    if (config.file.enabled) {
      transports.push({
        type: 'file',
        level: config.file.level,
        dirname: config.file.path,
        filename: config.file.filename,
        format: config.file.format,
        rotation: config.file.rotation,
      });
    }
    
    if (config.external.enabled && config.external.service && config.external.dsn) {
      transports.push({
        type: 'external',
        service: config.external.service,
        dsn: config.external.dsn,
        level: config.external.level,
        sampleRate: config.external.sampleRate,
        environment: config.external.environment,
      });
    }
    
    return {
      level: config.level,
      format: config.format,
      transports,
      redact: {
        paths: config.redactFields,
        censor: '***REDACTED***',
      },
      correlationIdHeader: config.correlationIdHeader,
    };
  }

  shouldLogLevel(level: LogLevel): boolean {
    const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
    const configLevel = this.get().level;
    return levels.indexOf(level) <= levels.indexOf(configLevel);
  }

  getRotatingFileConfig() {
    const config = this.get().file;
    if (!config.enabled) return null;
    
    return {
      dirname: config.path,
      filename: config.filename,
      maxSize: config.rotation?.maxSize || '10m',
      maxFiles: config.rotation?.maxFiles || '30d',
      compress: config.rotation?.compress || true,
      maxAge: config.rotation?.maxAge,
    };
  }

  isDevelopmentMode(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
}
import Joi from "joi";
import { BaseConfigService } from "./base-config.service";
import { Injectable } from "@nestjs/common";

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections?: number;
  idleTimeout?: number;
  connectionTimeout?: number;
  migrationsRun?: boolean;
}

@Injectable()
export class DatabaseConfigService extends BaseConfigService<DatabaseConfig> {
  protected readonly prefix = 'DB_';
  protected readonly schema = Joi.object({
    DB_HOST: Joi.string().hostname().default('localhost'),
    DB_PORT: Joi.number().port().default(5432),
    DB_DATABASE: Joi.string().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_SSL: Joi.boolean().default(false),
    DB_MAX_CONNECTIONS: Joi.number().min(1).max(100).default(10),
    DB_IDLE_TIMEOUT: Joi.number().min(1000).default(30000),
    DB_CONNECTION_TIMEOUT: Joi.number().min(1000).default(2000),
    DB_MIGRATIONS_RUN: Joi.boolean().default(true),
  })
  .custom((value, helpers) => {
    if (process.env.NODE_ENV === 'production') {
      if (value.DB_SSL === false) {
        helpers.error('any.invalid', {
          message: 'DB_SSL should be enabled in production',
        });
      }
      if (value.DB_PASSWORD && value.DB_PASSWORD.length < 12) {
        helpers.error('any.invalid', {
          message: 'Database password should be at least 12 characters in production',
        });
      }
    }
    return value;
  });

  protected transform(validatedEnv: Record<string, any>): DatabaseConfig {
    const config = this.stripPrefix(validatedEnv);
    
    return {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      ssl: config.ssl,
      maxConnections: config.maxConnections,
      idleTimeout: config.idleTimeout,
      connectionTimeout: config.connectionTimeout,
      migrationsRun: config.migrationsRun,
    };
  }

  getConnectionString(): string {
    const config = this.get();
    const ssl = config.ssl ? '?sslmode=require' : '';
    return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${ssl}`;
  }

  getTypeOrmConfig() {
    const config = this.get();
    return {
      type: 'postgres' as const,
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
      ssl: config.ssl,
      extra: {
        max: config.maxConnections,
        idleTimeoutMillis: config.idleTimeout,
        connectionTimeoutMillis: config.connectionTimeout,
      },
      synchronize: false,
      migrationsRun: config.migrationsRun,
      autoLoadEntities: true,
    };
  }
}
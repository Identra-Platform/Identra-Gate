import { Injectable } from "@nestjs/common";
import { BaseConfigService } from "./base-config.service";
import Joi from "joi";

export interface AgentWalletConfig {
  id: string;
  key: string;
  storageType?: 'sqlite' | 'postgres' | 'memory';
  databasePath?: string;
  autoProvision?: boolean;
  backupEnabled?: boolean;
  backupInterval?: number;
}

export interface AgentNetworkConfig {
  endpoints: string[];
  autoDiscoverEndpoints?: boolean;
  publicDidEndpoint?: string;
  adminEndpoint?: string;
  label?: string;
  imageUrl?: string;
}

export interface AgentConnectionConfig {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  autoAcceptConnections?: boolean;
  protocolVersion?: string;
}

export interface AgentMessagingConfig {
  transport: 'http' | 'ws' | 'wss';
  inboundTransports: string[];
  outboundTransports: string[];
  maxMessageSize?: number;
  queueMaxSize?: number;
}

export interface AgentConfig {
  wallet: AgentWalletConfig;
  network: AgentNetworkConfig;
  connection: AgentConnectionConfig;
  messaging: AgentMessagingConfig;
  autoUpdate?: boolean;
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  plugins?: string[];
  maxConcurrentOperations?: number;
  autoCreateDid: boolean;
}

@Injectable()
export class AgentConfigService extends BaseConfigService<AgentConfig> {
  protected readonly prefix = 'AGENT_';
  protected readonly schema = Joi.object({
    AGENT_WALLET_ID: Joi.string().required(),
    AGENT_WALLET_KEY: Joi.string().required(),
    AGENT_WALLET_STORAGE_TYPE: Joi.string()
      .valid('sqlite', 'postgres', 'memory')
      .default('sqlite'),
    AGENT_WALLET_DATABASE_PATH: Joi.string().default('./data/wallet.db'),
    AGENT_WALLET_AUTO_PROVISION: Joi.boolean().default(true),
    AGENT_WALLET_BACKUP_ENABLED: Joi.boolean().default(false),
    AGENT_WALLET_BACKUP_INTERVAL: Joi.number().min(3600).default(86400), // 24 hours in seconds
    
    AGENT_NETWORK_ENDPOINTS: Joi.string().default('http://localhost:3000'),
    AGENT_NETWORK_AUTO_DISCOVER_ENDPOINTS: Joi.boolean().default(false),
    AGENT_NETWORK_PUBLIC_DID_ENDPOINT: Joi.string().uri().allow('').optional(),
    AGENT_NETWORK_ADMIN_ENDPOINT: Joi.string().uri().allow('').optional(),
    AGENT_NETWORK_LABEL: Joi.string().default('Credential Issuer'),
    AGENT_NETWORK_IMAGE_URL: Joi.string().uri().allow('').optional(),
    
    AGENT_CONNECTION_TIMEOUT: Joi.number().min(1000).default(30000),
    AGENT_CONNECTION_MAX_RETRIES: Joi.number().min(0).default(3),
    AGENT_CONNECTION_RETRY_DELAY: Joi.number().min(100).default(1000),
    AGENT_CONNECTION_AUTO_ACCEPT: Joi.boolean().default(true),
    AGENT_CONNECTION_PROTOCOL_VERSION: Joi.string().default('1.0'),
    
    AGENT_MESSAGING_TRANSPORT: Joi.string()
      .valid('http', 'ws', 'wss')
      .default('http'),
    AGENT_MESSAGING_INBOUND_TRANSPORTS: Joi.string().default('http'),
    AGENT_MESSAGING_OUTBOUND_TRANSPORTS: Joi.string().default('http'),
    AGENT_MESSAGING_MAX_MESSAGE_SIZE: Joi.number().min(1024).default(1048576), // 1MB
    AGENT_MESSAGING_QUEUE_MAX_SIZE: Joi.number().min(1).default(1000),
    
    AGENT_AUTO_UPDATE: Joi.boolean().default(false),
    AGENT_LOG_LEVEL: Joi.string()
      .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal')
      .default('info'),
    AGENT_PLUGINS: Joi.string().allow('').optional(),
    AGENT_MAX_CONCURRENT_OPERATIONS: Joi.number().min(1).default(10),
    AGENT_AUTO_CREATE_DID: Joi.boolean().default(true)
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
    // Production validations
    if (process.env.NODE_ENV === 'production') {
      if (value.AGENT_WALLET_STORAGE_TYPE === 'memory') {
        return helpers.error('any.invalid', {
          message: 'Memory storage should not be used in production',
        });
      }
      if (!value.AGENT_WALLET_BACKUP_ENABLED) {
        return helpers.error('any.invalid', {
          message: 'Wallet backup should be enabled in production',
        });
      }
    }
    return value;
  });

  protected transform(validatedEnv: Record<string, any>): AgentConfig {
    const config = this.stripPrefix(validatedEnv);
    
    const endpoints = config.networkEndpoints
      ? config.networkEndpoints.split(',').map((endpoint: string) => endpoint.trim()).filter(Boolean)
      : ['http://localhost:3000'];
    
    const inboundTransports = config.messagingInboundTransports
      ? config.messagingInboundTransports.split(',').map((transport: string) => transport.trim()).filter(Boolean)
      : ['http'];
    
    const outboundTransports = config.messagingOutboundTransports
      ? config.messagingOutboundTransports.split(',').map((transport: string) => transport.trim()).filter(Boolean)
      : ['http'];
    
    const plugins = config.plugins
      ? config.plugins.split(',').map((plugin: string) => plugin.trim()).filter(Boolean)
      : [];

    return {
      wallet: {
        id: config.walletId,
        key: config.walletKey,
        storageType: config.walletStorageType,
        databasePath: config.walletDatabasePath,
        autoProvision: config.walletAutoProvision,
        backupEnabled: config.walletBackupEnabled,
        backupInterval: config.walletBackupInterval,
      },
      network: {
        endpoints,
        autoDiscoverEndpoints: config.networkAutoDiscoverEndpoints,
        publicDidEndpoint: config.networkPublicDidEndpoint,
        adminEndpoint: config.networkAdminEndpoint,
        label: config.networkLabel,
        imageUrl: config.networkImageUrl,
      },
      connection: {
        timeout: config.connectionTimeout,
        maxRetries: config.connectionMaxRetries,
        retryDelay: config.connectionRetryDelay,
        autoAcceptConnections: config.connectionAutoAccept,
        protocolVersion: config.connectionProtocolVersion,
      },
      messaging: {
        transport: config.messagingTransport,
        inboundTransports,
        outboundTransports,
        maxMessageSize: config.messagingMaxMessageSize,
        queueMaxSize: config.messagingQueueMaxSize,
      },
      autoUpdate: config.autoUpdate,
      logLevel: config.logLevel,
      plugins,
      maxConcurrentOperations: config.maxConcurrentOperations,
      autoCreateDid: config.autoCreateDid
    };
  }

  getWalletConfig() {
    const config = this.get().wallet;
    
    if (config.storageType === 'sqlite') {
      return {
        type: 'sqlite' as const,
        config: {
          path: config.databasePath,
        },
      };
    } else if (config.storageType === 'postgres') {
      return {
        type: 'postgres' as const,
        config: {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_DATABASE || 'agent_wallet',
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          ssl: process.env.DB_SSL === 'true',
        },
      };
    } else {
      return {
        type: 'memory' as const,
        config: {},
      };
    }
  }

  getAskarConfig() {
    const walletConfig = this.get().wallet;
    return {
      id: walletConfig.id,
      key: walletConfig.key,
      ...this.getWalletConfig(),
    };
  }

  getAgentConfig() {
    return {
      allowInsecureHttpUrls: process.env.NODE_ENV !== 'production',
    };
  }

  shouldAutoProvision(): boolean {
    return this.get().wallet.autoProvision || process.env.NODE_ENV === 'development';
  }

  getMaxConcurrentOperations(): number {
    return this.get().maxConcurrentOperations || 10;
  }

  getEndpoints(): string[] {
    return this.get().network.endpoints;
  }
}
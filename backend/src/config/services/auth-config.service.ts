import { Injectable } from "@nestjs/common";
import Joi from "joi";
import { BaseConfigService } from "./base-config.service";

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  algorithm: string;
  issuer?: string;
  audience?: string;
}

export interface RefreshTokenConfig {
  secret: string;
  expiresIn: string;
  rememberMeExpiresIn: string;
}

export interface PasswordConfig {
  bcryptRounds: number;
  minLength: number;
  requireSpecialChar: boolean;
  requireNumber: boolean;
  requireUppercase: boolean;
  maxAttempts: number;
  lockoutDuration: number;
}

export interface SessionConfig {
  cookieName: string;
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
}

export interface ApiKeyConfig {
  enabled: boolean;
  headerName: string;
  keys?: string[];
}

export interface OAuthConfig {
  google?: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    callbackUrl?: string;
  };
  github?: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    callbackUrl?: string;
  };
  microsoft?: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    callbackUrl?: string;
    tenant?: string;
  };
}

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
}

export interface AuthConfig {
  jwt: JwtConfig;
  refreshToken: RefreshTokenConfig;
  password: PasswordConfig;
  session: SessionConfig;
  apiKey: ApiKeyConfig;
  oauth: OAuthConfig;
  rateLimit: RateLimitConfig;
  corsOrigins?: string[];
  requireEmailVerification: boolean;
  require2FA: boolean;
}

@Injectable()
export class AuthConfigService extends BaseConfigService<AuthConfig> {
  protected readonly prefix = 'AUTH_';
  protected readonly schema = Joi.object({
    // JWT Configuration
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRES_IN: Joi.string().default('1h'),
    JWT_ALGORITHM: Joi.string().default('HS256'),
    JWT_ISSUER: Joi.string().allow('').optional(),
    JWT_AUDIENCE: Joi.string().allow('').optional(),
    
    // Refresh Token Configuration
    REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
    REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
    REFRESH_TOKEN_REMEMBER_ME_EXPIRES_IN: Joi.string().default('30d'),
    
    // Password Configuration
    BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),
    PASSWORD_MIN_LENGTH: Joi.number().min(8).default(12),
    PASSWORD_REQUIRE_SPECIAL_CHAR: Joi.boolean().default(true),
    PASSWORD_REQUIRE_NUMBER: Joi.boolean().default(true),
    PASSWORD_REQUIRE_UPPERCASE: Joi.boolean().default(true),
    PASSWORD_MAX_ATTEMPTS: Joi.number().min(1).default(5),
    PASSWORD_LOCKOUT_DURATION: Joi.number().min(60).default(900), // 15 minutes
    
    // Session Configuration
    SESSION_COOKIE_NAME: Joi.string().default('session'),
    SESSION_MAX_AGE: Joi.number().min(60).default(86400), // 24 hours
    SESSION_SECURE: Joi.boolean().default(process.env.NODE_ENV === 'production'),
    SESSION_HTTP_ONLY: Joi.boolean().default(true),
    SESSION_SAME_SITE: Joi.string().valid('strict', 'lax', 'none').default('lax'),
    SESSION_DOMAIN: Joi.string().allow('').optional(),
    
    // API Key Configuration
    API_KEY_ENABLED: Joi.boolean().default(false),
    API_KEY_HEADER_NAME: Joi.string().default('x-api-key'),
    API_KEYS: Joi.string().allow('').optional(),
    
    // OAuth Configuration
    OAUTH_GOOGLE_ENABLED: Joi.boolean().default(false),
    OAUTH_GOOGLE_CLIENT_ID: Joi.string().when('OAUTH_GOOGLE_ENABLED', {
      is: true,
      then: Joi.required(),
    }),
    OAUTH_GOOGLE_CLIENT_SECRET: Joi.string().when('OAUTH_GOOGLE_ENABLED', {
      is: true,
      then: Joi.required(),
    }),
    OAUTH_GOOGLE_CALLBACK_URL: Joi.string().uri().allow('').optional(),
    
    OAUTH_GITHUB_ENABLED: Joi.boolean().default(false),
    OAUTH_GITHUB_CLIENT_ID: Joi.string().when('OAUTH_GITHUB_ENABLED', {
      is: true,
      then: Joi.required(),
    }),
    OAUTH_GITHUB_CLIENT_SECRET: Joi.string().when('OAUTH_GITHUB_ENABLED', {
      is: true,
      then: Joi.required(),
    }),
    OAUTH_GITHUB_CALLBACK_URL: Joi.string().uri().allow('').optional(),
    
    OAUTH_MICROSOFT_ENABLED: Joi.boolean().default(false),
    OAUTH_MICROSOFT_CLIENT_ID: Joi.string().when('OAUTH_MICROSOFT_ENABLED', {
      is: true,
      then: Joi.required(),
    }),
    OAUTH_MICROSOFT_CLIENT_SECRET: Joi.string().when('OAUTH_MICROSOFT_ENABLED', {
      is: true,
      then: Joi.required(),
    }),
    OAUTH_MICROSOFT_CALLBACK_URL: Joi.string().uri().allow('').optional(),
    OAUTH_MICROSOFT_TENANT: Joi.string().default('common'),
    
    // Rate Limiting
    AUTH_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
    AUTH_RATE_LIMIT_WINDOW_MS: Joi.number().min(1000).default(900000), // 15 minutes
    AUTH_RATE_LIMIT_MAX_REQUESTS: Joi.number().min(1).default(5),
    AUTH_RATE_LIMIT_SKIP_SUCCESSFUL: Joi.boolean().default(false),
    
    // Feature Flags
    REQUIRE_EMAIL_VERIFICATION: Joi.boolean().default(false),
    REQUIRE_2FA: Joi.boolean().default(false),
  })
  .custom((value, helpers) => {
    // Production validations
    if (process.env.NODE_ENV === 'production') {
      if (value.JWT_SECRET.length < 32) {
        return helpers.error('any.invalid', {
          message: 'JWT_SECRET must be at least 32 characters in production',
        });
      }
      if (value.REFRESH_TOKEN_SECRET.length < 32) {
        return helpers.error('any.invalid', {
          message: 'REFRESH_TOKEN_SECRET must be at least 32 characters in production',
        });
      }
      if (!value.SESSION_SECURE) {
        return helpers.error('any.invalid', {
          message: 'SESSION_SECURE should be true in production',
        });
      }
    }
    
    // Validate OAuth configuration when enabled
    const oauthProviders = ['GOOGLE', 'GITHUB', 'MICROSOFT'];
    for (const provider of oauthProviders) {
      const enabled = value[`OAUTH_${provider}_ENABLED`];
      const clientId = value[`OAUTH_${provider}_CLIENT_ID`];
      const clientSecret = value[`OAUTH_${provider}_CLIENT_SECRET`];
      
      if (enabled && (!clientId || !clientSecret)) {
        return helpers.error('any.required', {
          message: `OAUTH_${provider}_CLIENT_ID and OAUTH_${provider}_CLIENT_SECRET are required when OAUTH_${provider}_ENABLED is true`,
        });
      }
    }
    
    return value;
  });

  protected transform(validatedEnv: Record<string, any>): AuthConfig {
    const config = this.stripPrefix(validatedEnv);
    
    const apiKeys = config.apiKeys
      ? config.apiKeys.split(',').map((key: string) => key.trim()).filter(Boolean)
      : [];

    return {
      jwt: {
        secret: validatedEnv.JWT_SECRET,
        expiresIn: validatedEnv.JWT_EXPIRES_IN,
        algorithm: validatedEnv.JWT_ALGORITHM,
        issuer: validatedEnv.JWT_ISSUER,
        audience: validatedEnv.JWT_AUDIENCE,
      },
      refreshToken: {
        secret: validatedEnv.REFRESH_TOKEN_SECRET,
        expiresIn: validatedEnv.REFRESH_TOKEN_EXPIRES_IN,
        rememberMeExpiresIn: validatedEnv.REFRESH_TOKEN_REMEMBER_ME_EXPIRES_IN,
      },
      password: {
        bcryptRounds: validatedEnv.BCRYPT_ROUNDS,
        minLength: validatedEnv.PASSWORD_MIN_LENGTH,
        requireSpecialChar: validatedEnv.PASSWORD_REQUIRE_SPECIAL_CHAR,
        requireNumber: validatedEnv.PASSWORD_REQUIRE_NUMBER,
        requireUppercase: validatedEnv.PASSWORD_REQUIRE_UPPERCASE,
        maxAttempts: validatedEnv.PASSWORD_MAX_ATTEMPTS,
        lockoutDuration: validatedEnv.PASSWORD_LOCKOUT_DURATION,
      },
      session: {
        cookieName: validatedEnv.SESSION_COOKIE_NAME,
        maxAge: validatedEnv.SESSION_MAX_AGE,
        secure: validatedEnv.SESSION_SECURE,
        httpOnly: validatedEnv.SESSION_HTTP_ONLY,
        sameSite: validatedEnv.SESSION_SAME_SITE,
        domain: validatedEnv.SESSION_DOMAIN,
      },
      apiKey: {
        enabled: validatedEnv.API_KEY_ENABLED,
        headerName: validatedEnv.API_KEY_HEADER_NAME,
        keys: apiKeys,
      },
      oauth: {
        google: {
          enabled: validatedEnv.OAUTH_GOOGLE_ENABLED,
          clientId: validatedEnv.OAUTH_GOOGLE_CLIENT_ID,
          clientSecret: validatedEnv.OAUTH_GOOGLE_CLIENT_SECRET,
          callbackUrl: validatedEnv.OAUTH_GOOGLE_CALLBACK_URL,
        },
        github: {
          enabled: validatedEnv.OAUTH_GITHUB_ENABLED,
          clientId: validatedEnv.OAUTH_GITHUB_CLIENT_ID,
          clientSecret: validatedEnv.OAUTH_GITHUB_CLIENT_SECRET,
          callbackUrl: validatedEnv.OAUTH_GITHUB_CALLBACK_URL,
        },
        microsoft: {
          enabled: validatedEnv.OAUTH_MICROSOFT_ENABLED,
          clientId: validatedEnv.OAUTH_MICROSOFT_CLIENT_ID,
          clientSecret: validatedEnv.OAUTH_MICROSOFT_CLIENT_SECRET,
          callbackUrl: validatedEnv.OAUTH_MICROSOFT_CALLBACK_URL,
          tenant: validatedEnv.OAUTH_MICROSOFT_TENANT,
        },
      },
      rateLimit: {
        enabled: validatedEnv.AUTH_RATE_LIMIT_ENABLED,
        windowMs: validatedEnv.AUTH_RATE_LIMIT_WINDOW_MS,
        maxRequests: validatedEnv.AUTH_RATE_LIMIT_MAX_REQUESTS,
        skipSuccessfulRequests: validatedEnv.AUTH_RATE_LIMIT_SKIP_SUCCESSFUL,
      },
      requireEmailVerification: validatedEnv.REQUIRE_EMAIL_VERIFICATION,
      require2FA: validatedEnv.REQUIRE_2FA,
    };
  }

  // Convenience getters
  getJwtConfig() {
    return {
      secret: this.get().jwt.secret,
      signOptions: {
        expiresIn: this.get().jwt.expiresIn,
        algorithm: this.get().jwt.algorithm,
        issuer: this.get().jwt.issuer,
        audience: this.get().jwt.audience,
      },
      verifyOptions: {
        algorithms: [this.get().jwt.algorithm],
        issuer: this.get().jwt.issuer,
        audience: this.get().jwt.audience,
      },
    };
  }

  getRefreshTokenConfig() {
    return this.get().refreshToken;
  }

  getPasswordPolicy() {
    const config = this.get().password;
    return {
      minLength: config.minLength,
      requireSpecialChar: config.requireSpecialChar,
      requireNumber: config.requireNumber,
      requireUppercase: config.requireUppercase,
      bcryptRounds: config.bcryptRounds,
    };
  }

  getSessionConfig() {
    const config = this.get().session;
    return {
      name: config.cookieName,
      secret: this.get().jwt.secret, // Use JWT secret for session signing
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: config.maxAge * 1000, // Convert to milliseconds
        secure: config.secure,
        httpOnly: config.httpOnly,
        sameSite: config.sameSite,
        domain: config.domain,
      },
    };
  }

  getOAuthConfig(provider: 'google' | 'github' | 'microsoft') {
    const config = this.get().oauth[provider];
    if (!config || !config.enabled) {
      return null;
    }
    return config;
  }

  getEnabledOAuthProviders(): string[] {
    const providers: string[] = [];
    const oauth = this.get().oauth;
    
    if (oauth.google?.enabled) providers.push('google');
    if (oauth.github?.enabled) providers.push('github');
    if (oauth.microsoft?.enabled) providers.push('microsoft');
    
    return providers;
  }

  getRateLimitConfig() {
    return this.get().rateLimit;
  }

  shouldRequireEmailVerification(): boolean {
    return this.get().requireEmailVerification;
  }

  shouldRequire2FA(): boolean {
    return this.get().require2FA;
  }

  validateApiKey(key: string): boolean {
    const config = this.get().apiKey;
    if (!config.enabled) return false;
    return config.keys?.includes(key) || false;
  }
}
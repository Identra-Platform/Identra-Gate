import type { BulkCredentialItem, CredentialData, CredentialTemplate, CredentialValidity, HealthCheck, HealthMetrics, IssuedCredential, LogEntry, Role, ServerMetrics, TemplateField, User } from "./inferred";

// Health Types
export interface HealthResponse {
  status: 'up' | 'down' | 'warning' | 'unknown';
  timestamp: string;
  uptime: string;
  environment: string;
  checks: HealthCheck[];
  services: HealthCheck[];
  metrics: HealthMetrics;
}

// Setup Types
export interface SetupStatusResponse {
  requiredSetup: boolean;
  serverName: string | null;
  version: string;
}

export interface InitializeRequest {
  serverName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  adminName: string;
}

export interface InitializeResponse {
  success: boolean;
  recoveryPhrase: string;
  message: string;
  adminUser: {
    id: string;
    email: string;
    name: string;
  };
}

export interface RecoveryVerifyRequest {
  email: string;
  recoveryPhrase: string;
}

export interface RecoveryVerifyResponse {
  valid: boolean;
  token: string;
  message: string;
}

export interface ResetRequest {
  adminPassword: string;
  recoveryPhrase: string;
  confirmReset: boolean;
}

export interface ResetResponse {
  success: boolean;
  message: string;
  restartToken: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// User Management Types
export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'admin' | 'user';
}

export interface ListUsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  roles: Role[];
}

export interface CreateUserResponse {
  success: boolean;
  user: User;
  message: string;
}

export interface GetUserResponse extends User {}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: Role[];
  active?: boolean;
}

export interface UpdateUserResponse {
  success: boolean;
  user: User;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

// Server Audit Types
export interface GetLogsQuery {
  level?: 'info' | 'warning' | 'error' | 'debug';
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
}

export interface GetLogsResponse {
  logs: LogEntry[];
  total: number;
  filtered: number;
}

export interface GetMetricsQuery {
  period?: string; // e.g., '7d', '30d', '1y'
}

export interface GetMetricsResponse {
  users: ServerMetrics['users'];
  credentials: ServerMetrics['credentials'];
  timestamp: string;
}

// Credential Template Types
export interface ListTemplatesQuery {
  active?: boolean;
  limit?: number;
  page?: number;
  search?: string;
}

export interface ListTemplatesResponse {
  templates: CredentialTemplate[];
  total: number;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  schema: {
    fields: TemplateField[];
  };
  validityDays?: number;
}

export interface CreateTemplateResponse {
  success: boolean;
  template: CredentialTemplate;
}

export interface GetTemplateResponse extends CredentialTemplate {}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  schema?: {
    fields: TemplateField[];
  };
  active?: boolean;
  validityDays?: number;
}

export interface UpdateTemplateResponse {
  success: boolean;
  template: CredentialTemplate;
}

export interface DeleteTemplateResponse {
  success: boolean;
  message: string;
}

// Credentail Issuance Types
export interface IssueCredentialRequest {
  templateId: string;
  recipient: string;
  data: CredentialData;
  validity?: CredentialValidity;
  metadata?: Record<string, any>;
}

export interface IssueCredentialResponse {
  success: boolean;
  credential: IssuedCredential;
}

export interface BulkIssueRequest {
  templateId: string;
  credentials: BulkCredentialItem[];
  validity?: CredentialValidity;
  sendNotifications?: boolean;
}

export interface BulkIssueResponse {
  success: boolean;
  batchId: string;
  issuedCount: number;
  failedCount: number;
  credentials: Array<{
    id: string;
    recipient: string;
    status: 'issued' | 'failed';
    error?: string;
  }>;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

export interface ListCredentialsQuery {
  status?: 'active' | 'expired' | 'revoked' | 'suspended' | 'issued';
  templateId?: string;
  recipientDid?: string;
  limit?: number;
  page?: number;
}

export interface ListCredentialsResponse {
  credentials: IssuedCredential[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetCredentialResponse extends IssuedCredential {}
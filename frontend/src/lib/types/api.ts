// === Audit Types ===
export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  status: string;
  error?: string;
  user: User;
}

export interface Statistics {
  totalUsers: number;
  healthPercentage: number;
}


// === Health Types ===
export type HealthStatus = 'up' | 'down' | 'warning' | 'unknown';

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  responseTime: number | null;
  required: boolean;
  lastCheck: string | null;
  details?: Record<string, any>;
  error?: string;
}

export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  version?: string;
  uptime: string;
  environment: string;
  checks: HealthCheck[];
  metrics?: SystemMetrics;
  services?: HealthCheck[];
}

export interface LightHealthResponse {
  status: HealthStatus;
  timestamp: string;
  version?: string;
}

export interface DatabaseHealthResponse {
  status: HealthStatus;
  database: string;
  host: string;
  responseTime: number | null;
  connection: string;
  details?: {
    host: string;
    database: string;
    connection: string;
    poolSize?: number | string;
    version?: string;
  };
  required?: boolean;
  lastCheck?: string | null;
  error?: string;
}

export interface SystemMetrics {
  cpu: {
    usage?: number;
    loadAverage: {
      1: number;
      5: number;
      15: number;
    };
    cores: number;
    model?: string;
  };
  memory: {
    total: string | number;
    free: string | number;
    used: string | number;
    usagePercent: number;
  };
  disk?: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  os?: {
    platform: string;
    release: string;
    type: string;
    arch: string;
    uptime: number;
  };
  process?: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    version: string;
  };
  network?: {
    hostname: string;
    externalIPs: string[];
  };
  uptime?: number;
}

export interface MetricsResponse {
  timestamp: string;
  metrics: SystemMetrics;
}

// === Auth Types ===
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}

export interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  roles: string[];
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogoutResponse {
  message: string;
}

// === User Types ===
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  roles: string[];
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  roles?: string[];
}

export interface PaginatedUsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

// === Credential Types ===
export interface CredentialField {
  fieldName: string;
  fieldType: 'text' | 'date' | 'number' | 'select';
  path: string;
  allowedValues?: string[];
  required: boolean;
}

export interface CredentialRequest {
  requestName: string;
  credentialType: string;
  fields: CredentialField[];
  settings: {
    allowMultipleUse: boolean;
  };
}

export interface CreateCredentialOfferDto {
  credentialId: string;
  holderDid: string;
  claims: Record<string, any>;
}

export interface CredentialOfferResponse {
  id: string;
  credentialId: string;
  holderDid: string;
  claims: Record<string, any>;
  credentialData: Record<string, any>;
  status: string;
  createdAt: string;
  expiration: string;
  issuer: User;
}

export interface CreateFieldDto {
  name: string;
  required?: boolean;
  type: string;
  description?: string;
  pattern?: string;
  min?: number;
  max?: number;
  options?: string[];
  defaultValue?: any;
  order?: number ;
  group?: string;
}

export interface CreateDisplayDto {
  background: string;
  textColor?: string;
  logo?: string;
}

export interface CreateTemplateDto {
  name: string;
  description: string;
  format?: string;
  credentialType: string;
  display: CreateDisplayDto;
  fields?: CreateFieldDto[];
  tags?: string[];
  active?: boolean;
  validityDays?: number;
  metadata?: Record<string, any>;
}

export interface TemplateTag {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface TemplateField {
  id: string;
  name: string;
  path: string[];
  required: boolean;
  type: string;
  description: string | null;
  pattern: string | null;
  min: number | null;
  max: number | null;
  options: string[] | null;
  defaultValue: any;
  order: number;
  group: string | null;
}

export interface TemplateDisplay {
  background: string;
  textColor: string;
  logo?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  credentialType: string;
  format: string;
  display: TemplateDisplay;
  fields: TemplateField[];
  tags: TemplateTag[];
  active: boolean;
  validityDays: number | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any> | null;
}

// === Verification Types ===
export interface CreateAuthorizationRequestDto {
  credentialRequests: CredentialRequest[];
  metadata: {
    purpose: string;
    expirationDays: number;
  };
}

export interface VerificationRequest {
  id: string;
  status: 'pending' | 'completed' | 'expired' | 'failed';
  credentialRequests: CredentialRequest[];
  metadata: {
    purpose: string;
    expirationDays: number;
  };
  createdAt: string;
  completedAt?: string;
  expiration: string;
  result?: {
    verified: boolean;
    confidence: number;
  };
}

// === Global Types ===
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
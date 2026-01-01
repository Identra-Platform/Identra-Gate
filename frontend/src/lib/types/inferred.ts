export type Role = 'admin' | 'verifier' | 'issuer';

export interface HealthCheck {
  name: string;
  status: 'up' | 'down' | 'warning' | 'unknown';
  responseTime: number;
  required: boolean;
  lastCheck: string;
  error?: string | null;
  details?: Record<string, any>;
}

export interface HealthMetrics {
  cpu: {
    loadAverage: { 1: number; 5: number; 15: number };
    cores: number;
    model: string;
  };
  memory: {
    total: string;
    free: string;
    used: string;
    usagePercent: number;
  };
  os: {
    platform: string;
    release: string;
    type: string;
    arch: string;
    uptime: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    version: string;
  };
  network: {
    hostname: string;
    externalIPs: string[];
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  createdAt?: string;
  lastLogin?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  userId?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export interface ServerMetrics {
  users: {
    total: number;
    active: number;
  };
  credentials: {
    issued: number;
    verified: number;
    revoked: number;
  };
}

export interface TemplateField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'image' | 'select';
  required: boolean;
  label?: string;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface CredentialTemplate {
  id: string;
  name: string;
  description?: string;
  schema: {
    fields: TemplateField[];
  };
  validityDays?: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CredentialValidity {
  from: string;
  until: string;
}

export interface CredentialData {
  [key: string]: any;
}

export interface IssuedCredential {
  id: string;
  templateId: string;
  recipient: string;
  data: CredentialData;
  status: 'issued' | 'active' | 'expired' | 'revoked' | 'suspended';
  issuedAt: string;
  expiresAt: string;
}

export interface BulkCredentialItem {
  recipient: string;
  data: CredentialData;
}
export interface CredentialData {
  [key: string]: any;
}

export interface IssuedCredential {
  id: string;
  credentialId: string;
  holderDid: string;
  issuedAt: string;
  expiresAt?: string;
  format: string;
  metadata?: Record<string, any>;
}

export class VerificationResult {
  requestId: string;
  valid: boolean;
  verifiedAt: string;
  claims?: Record<string, any>;
  error?: string;
}

export interface IssuanceSessionData {
  sessionId: string;
  credentialId: string;
  holderDid?: string;
  claims: Record<string, any>;
  createdAt: Date;
  status: 'pending' | 'completed';
}
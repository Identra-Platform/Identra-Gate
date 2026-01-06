import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface IssuanceSessionData {
  sessionId: string;
  credentialId: string;
  holderDid?: string;
  claims: Record<string, any>;
  createdAt: Date;
  status: 'pending' | 'completed';
}

export interface VerificationSessionData {
  sessionId: string;
  requestId: string;
  createdAt: Date;
  status: 'pending'| 'completed';
}

@Injectable()
export class SessionManagerService {
  private sessions = new Map<string, IssuanceSessionData | VerificationSessionData>();
  
  createIssuanceSession(credentialId: string, claims: Record<string, any>, holderDid?: string) {
    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      sessionId,
      credentialId,
      holderDid,
      claims,
      createdAt: new Date(),
      status: 'pending'
    });
    return sessionId;
  }
  
  createVerificationSession(requestId: string) {
    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      sessionId,
      requestId,
      createdAt: new Date(),
      status: 'pending'
    });
    return sessionId;
  }
  
  getSession<T>(sessionId: string) {
    return this.sessions.get(sessionId) as T;
  }
  
  completeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
    }
  }
}

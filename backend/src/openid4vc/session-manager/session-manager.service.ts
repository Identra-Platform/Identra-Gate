import { Injectable } from '@nestjs/common';
import { IssuanceSessionData } from 'src/types/api';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionManagerService {
  private sessions = new Map<string, IssuanceSessionData>();
  
  createSession(credentialId: string, claims: Record<string, any>, holderDid?: string) {
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
  
  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }
  
  completeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
    }
  }
}

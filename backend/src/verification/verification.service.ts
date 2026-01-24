import { Injectable } from '@nestjs/common';
import { CreateAuthorizationRequestDto } from './dto/verification-request.dto';
import { DcqlQuery } from '@credo-ts/core';
import { v4 as uuidv4 } from 'uuid';
import { OpenId4VcService } from 'src/credo/openid4vc.service';
import { InjectRepository } from '@nestjs/typeorm';
import { VerificationSession } from './entities/verification-session.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class VerificationService {
  private expirationTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly openId4VcService: OpenId4VcService,
    @InjectRepository(VerificationSession)
    private readonly verificationSessionRepository: Repository<VerificationSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async authorize(
    verifierId: string,
    createAuthorizationRequestDto: CreateAuthorizationRequestDto,
  ) {
    const dcqlQuery = this.convertToDcql(createAuthorizationRequestDto);
    const request =
      await this.openId4VcService.createAuthorizationRequest(dcqlQuery);

    const verifier = await this.userRepository.findOneOrFail({
      where: { id: verifierId },
    });
    const expiresIn =
      (await this.openId4VcService.getAgent()).openid4vc.verifier?.config
        .authorizationRequestExpiresInSeconds ?? 300;
    
    const session = this.verificationSessionRepository.create({
      status: 'pending',
      verifier,
      request: {
        id: request.requestId,
        data: request.requestData,
      },
      requestedCredentials:
        createAuthorizationRequestDto.credentialRequests.map((req) => {
          return {
            credentialType: req.credentialType,
            fields: req.fields.map((field) => field.fieldName),
          };
        }),
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    });

    await this.verificationSessionRepository.save(session);
    
    // Schedule expiration
    this.scheduleExpiration(session.id, expiresIn);
    
    return session;
  }

  async getVerificationResults(id: string) {
    const session = await this.verificationSessionRepository.findOneOrFail({
      where: { id },
      relations: ['verifier']
    });

    // Clear expiration timer if session is already completed/expired
    if (session.status !== 'pending') {
      this.clearExpirationTimer(id);
    }

    try {
      const response = await this.openId4VcService.getVerificationResponse(
        session.request.id,
      );

      const isVerified = response?.dcql?.presentationResult.can_be_satisfied;
      const status = isVerified
        ? 'success'
        : typeof isVerified === 'undefined'
          ? 'pending'
          : 'failed';
      
      // Update session status
      session.status = status;

      let results:
        | Record<
            string,
            {
              status: string;
              claims?: Record<string, any>[];
            }
          >
        | undefined = undefined;

      if (status === 'success') {
        results = {};

        const queryIdToCredentialType = new Map<string, string>();
        session.requestedCredentials.forEach((req, index) => {
          const queryId = Object.keys(
            response?.dcql?.presentationResult.credential_matches!,
          )[index];
          queryIdToCredentialType.set(queryId, req.credentialType);
        });

        Object.entries(
          response?.dcql?.presentationResult.credential_matches!,
        ).forEach(([queryId, match]) => {
          const credentialType = queryIdToCredentialType.get(queryId);
          if (!credentialType) return;

          // Get the requested fields for this credential type
          const requestedCredential = session.requestedCredentials.find(
            (req) => req.credentialType === credentialType,
          );
          const requestedFields = requestedCredential?.fields || [];

          if (match.success && match.valid_credentials?.length > 0) {
            const credentials = match.valid_credentials.map((cred) => {
              const claims = cred.claims.valid_claim_sets.map((claim) => {
                // Filter claims to only include requested fields
                const filteredClaims = this.filterClaimsByFields(
                  claim.output,
                  requestedFields,
                );
                return filteredClaims;
              });

              return {
                claims: claims.length === 1 ? claims[0] : claims,
              };
            });

            results![credentialType] = {
              status: 'success',
              claims: credentials,
            };
          } else {
            results![credentialType] = {
              status: 'failed',
            };
          }
        });
      }

      session.results = results;
      await this.verificationSessionRepository.save(session);

      // Clear expiration timer if session is completed
      if (status !== 'pending') {
        this.clearExpirationTimer(id);
      }

    } catch (error) {
      return session;
    }

    return session;
  }

  async getVerificationSessions() {
    return this.verificationSessionRepository.find({
      relations: ['verifier']
    });
  }

  private scheduleExpiration(sessionId: string, expiresIn: number) {
    const timer = setTimeout(async () => {
      await this.handleSessionExpiration(sessionId);
    }, expiresIn * 1000);

    this.expirationTimers.set(sessionId, timer);
  }

  private clearExpirationTimer(sessionId: string) {
    const timer = this.expirationTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.expirationTimers.delete(sessionId);
    }
  }

  private async handleSessionExpiration(sessionId: string) {
    try {
      const session = await this.verificationSessionRepository.findOne({
        where: { id: sessionId }
      });

      if (session && session.status === 'pending') {
        session.status = 'expired';
        await this.verificationSessionRepository.save(session);
        console.log(`Verification session ${sessionId} expired`);
      }

      this.expirationTimers.delete(sessionId);
    } catch (error) {
      console.error('Error handling verification session expiration:', error);
    }
  }

  private filterClaimsByFields(claims: Record<string, any>, fields: string[]): Record<string, any> {
    const filtered: Record<string, any> = {};
      
    for (const field of fields) {
      const pathParts = field.split('.');
      let current = claims;
      let target = filtered;

      for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]] !== undefined) {
          if (!target[pathParts[i]]) {
            target[pathParts[i]] = {};
          }
          target = target[pathParts[i]];
          current = current[pathParts[i]];
        } else {
          break;
        }
      }

      const lastKey = pathParts[pathParts.length - 1];
      if (current[lastKey] !== undefined) {
        target[lastKey] = current[lastKey];
      }
    }
      
    return filtered;
  }

  private convertToDcql(dto: CreateAuthorizationRequestDto): DcqlQuery {
    const credentials = dto.credentialRequests.map((credRequest, index) => {
      const id = uuidv4();

      const claims = credRequest.fields.map((field) => {
        const pathArray = ['fields', field.fieldName];

        const claim = {
          path: pathArray,
        };

        if (field.allowedValues && field.allowedValues.length > 0) {
          return {
            ...claim,
            values: field.allowedValues,
          };
        }

        return claim;
      });

      const credential = {
        id,
        format: 'dc+sd-jwt' as const,
        meta: {
          vct_values: [credRequest.credentialType],
        },
        multiple: credRequest.settings.allowMultipleUse,
      };

      if (claims && claims.length > 0) {
        return {
          ...credential,
          claims,
        };
      }

      return credential;
    });

    return {
      credentials,
    };
  }

  // Optional: Clean up all timers when service is destroyed
  onModuleDestroy() {
    this.expirationTimers.forEach(timer => clearTimeout(timer));
    this.expirationTimers.clear();
  }
}
import { Injectable } from '@nestjs/common';
import { CreateCredentialOfferDto } from './dto/credential-offer.dto';
import { Repository } from 'typeorm';
import { IssuedCredential } from '../credo/entities/issued-credential.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OpenId4VcService } from 'src/credo/openid4vc.service';
import { OfferedCredentialsConfigService } from 'src/config/services/offered-credentials-config.service';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly openId4VcService: OpenId4VcService,
    private readonly credentialsConfigService: OfferedCredentialsConfigService,
    @InjectRepository(IssuedCredential)
    private readonly issuedCredentialRepository: Repository<IssuedCredential>
  ) {}

  getCredentialTypes() {
    const credentials = this.credentialsConfigService.getAllCredentials();

    return credentials.map(cred => ({
      id: cred.id,
      name: cred.name,
      description: cred.description,
      format: cred.format,
      active: cred.active,
      fields: cred.fields.map(field => ({
        name: field.name,
        type: field.type,
        required: field.required,
        description: field.description,
        options: field.options,
      })),
      display: cred.display,
      tags: cred.tags,
    }));
  }

  getCredentialType(credentialId: string) {
    const credential = this.credentialsConfigService.getCredentialById(credentialId);
    
    if (!credential) {
      return null;
    }

    return {
      id: credential.id,
      name: credential.name,
      description: credential.description,
      format: credential.format,
      active: credential.active,
      fields: credential.fields,
      display: credential.display,
      tags: credential.tags,
    };
  }

  async createCredentialOffer(createCredentialOfferDto: CreateCredentialOfferDto) {
    const { credentialId, claims, holderDid } = createCredentialOfferDto;
    const credential = this.credentialsConfigService.getCredentialById(credentialId);
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found`);
    }

    this.validateClaims(credential, claims);

    const offer = await this.openId4VcService.createCredentialOfferWithClaims(
      credentialId,
      claims,
      holderDid
    );

    const issuedCredential = this.issuedCredentialRepository.create({
      credentialId, holderDid, claims, credentialData: offer,
      transactionId: offer.sessionId,
      status: 'pending'
    });

    await this.issuedCredentialRepository.save(issuedCredential);

    return issuedCredential;
  }

  private validateClaims(credential: any, claims: Record<string, any>) {
    for (const field of credential.fields) {
      if (field.required && !claims[field.name]) {
        throw new Error(`Missing required field: ${field.name}`);
      }
      
      if (claims[field.name] && field.type) {
        this.validateType(field.type, claims[field.name]);
      }
      
      if (field.options && claims[field.name]) {
        if (!field.options.includes(claims[field.name])) {
          throw new Error(`Invalid value for ${field.name}. Must be one of: ${field.options.join(', ')}`);
        }
      }
    }
  }
  
  private validateType(type: string, value: any) {
    if (typeof value !== type) {
      throw new Error(`Expected ${type}, got ${typeof value}`);
    }
  }
}

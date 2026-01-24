import { Injectable } from '@nestjs/common';
import { CreateCredentialOfferDto } from './dto/credential-offer.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OpenId4VcService } from 'src/credo/openid4vc.service';
import { OfferedCredentialsConfigService } from 'src/config/services/offered-credentials-config.service';
import { TemplatesService } from './templates/templates.service';
import { Credential } from './entities/credential.entity';
import { CredentialTemplate } from './templates/entities/credential-template.entity';
import { User } from 'src/users/entities/user.entity';
import { classToPlain, instanceToPlain } from 'class-transformer';

@Injectable()
export class CredentialsService {
  private expirationTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly openId4VcService: OpenId4VcService,
    private readonly credentialsConfigService: OfferedCredentialsConfigService,
    private readonly templateService: TemplatesService,
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    @InjectRepository(CredentialTemplate)
    private readonly credentialTemplateRepository: Repository<CredentialTemplate>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async createCredentialOffer(issuerId: string, createCredentialOfferDto: CreateCredentialOfferDto) {
    const { credentialId, claims, holderDid } = createCredentialOfferDto;
    const credential = await this.templateService.findOne(credentialId);
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found`);
    }

    this.validateClaims(credential, claims);

    const offer = await this.openId4VcService.createCredentialOfferWithClaims(
      credentialId,
      claims,
      holderDid
    );

    const expiresIn = (await this.openId4VcService.getAgent()).openid4vc.issuer?.config.statefulCredentialOfferExpirationInSeconds ?? 300;

    const template = await this.credentialTemplateRepository.findOneOrFail({
      where: { id: credentialId }
    });
    const issuer = await this.userRepository.findOneOrFail({
      where: { id: issuerId }
    });
    const issuedCredential = this.credentialRepository.create({
      holderDid, claims,
      credentialData: offer,
      transactionId: offer.sessionId,
      status: 'pending',
      issuer,
      template,
      expiresAt: new Date(Date.now() + (expiresIn * 1000))
    });

    this.scheduleEpiration(issuedCredential.id, expiresIn);

    await this.credentialRepository.save(issuedCredential);

    return issuedCredential;
  }

  async getCredentialById(id: string) {
    const credential = await this.credentialRepository.findOne({
      where: { id },
      relations: ['issuer']
    });
    return instanceToPlain(credential);
  }

  async getAllCredentials() {
    return this.credentialRepository.find({
      order: {
        issuedAt: 'DESC'
      }
    });
  }

  private scheduleEpiration(credentialId: string, expiresIn: number) {
    const timer = setTimeout(async () => {
      await this.handleCredentialExpiration(credentialId);
    }, expiresIn * 1000);

    this.expirationTimers.set(credentialId, timer);
  }

  private async handleCredentialExpiration(credentialId: string) {
    try {
      const credential = await this.credentialRepository.findOne({
        where: { id: credentialId }
      });

      if (credential && credential.status === 'pending') {
        credential.status = 'expired';
        await this.credentialRepository.save(credential);
      }

      this.expirationTimers.delete(credentialId);
    } catch (error) {
      console.error('Error handling credential expiration:', error);
    }
  }

  private validateClaims(credential: any, claims: Record<string, any>) {
    console.log(JSON.stringify(credential, null, 2));
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

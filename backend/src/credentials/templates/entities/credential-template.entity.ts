import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TemplateField } from "./template-field.entity";
import { CredentialTag } from "./credential-tag.entity";
import { OpenId4VciCredentialConfigurationSupportedWithFormats } from "@credo-ts/openid4vc";
import { Credential } from '../../entities/credential.entity';

@Entity()
export class CredentialTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  credentialType: string;

  @Column({ default: 'sd-jwt' })
  format: string;

  @Column('simple-json')
  display: {
    background: string;
    textColor?: string;
    logo?: string;
  }

  @OneToMany(() => TemplateField, field => field.template, {
    cascade: true,
    eager: true
  })
  fields: TemplateField[];

  @ManyToMany(() => CredentialTag, tag => tag.templates)
  @JoinTable()
  tags: CredentialTag[];

  @OneToMany(() => Credential, credential => credential.template)
  credentials: Credential[];

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  validityDays?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;


  toOpenId4Vc(
    supportedAlgorithms: string[] = ['ES256', 'EdDSA'],
    supportedProofTypes: string[] = ['jwt']
  ): OpenId4VciCredentialConfigurationSupportedWithFormats {
    const displayConfig = this.display || { background: '#000000' };

    const openIdConfig: OpenId4VciCredentialConfigurationSupportedWithFormats = {
      format: this.format === 'sd-jwt' ? 'dc+sd-jwt' : this.format as any,
      vct: this.credentialType,
      credential_metadata: {
        display: [{
          name: this.name,
          locale: 'en-US',
          description: this.description,
          background_color: displayConfig.background,
          text_color: displayConfig.textColor || '#FFFFFF',
          ...(displayConfig.logo && {
            logo: {
              uri: displayConfig.logo,
              alt_text: `${this.name} logo`
            }
          })
        }]
      }
    };

    if (this.fields && this.fields.length > 0 && openIdConfig.credential_metadata) {
      openIdConfig.credential_metadata.claims = this.fields
        .sort((a, b) => a.order - b.order)
        .map(field => ({
          path: Array.isArray(field.path) && field.path.length > 0 
            ? [field.path[0], ...field.path.slice(1)] 
            : ['credentialSubject', field.name],
          mandatory: field.required || false,
          display: [{
            name: field.name,
            locale: 'en-US',
            description: field.description || undefined
          }],
          // Add additional metadata based on field type
          ...(field.type && { value_type: this.mapFieldTypeToValueType(field.type) }),
          ...(field.options && { options: field.options }),
          ...(field.pattern && { pattern: field.pattern }),
          ...(field.min !== undefined && { min: field.min }),
          ...(field.max !== undefined && { max: field.max })
        }));
    }

    openIdConfig.cryptographic_binding_methods_supported = ['did', 'jwk'];
    openIdConfig.credential_signing_alg_values_supported = supportedAlgorithms;

    openIdConfig.proof_types_supported = supportedProofTypes.reduce((acc, type) => {
      acc[type] = {
        proof_signing_alg_values_supported: supportedAlgorithms
      };
      return acc;
    }, {} as Record<string, { proof_signing_alg_values_supported: string[] }>);

    return openIdConfig;
  }

  private mapFieldTypeToValueType(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'date': 'string',
      'boolean': 'boolean',
      'array': 'array',
      'object': 'object',
      'select': 'string'
    };
    
    return typeMap[fieldType] || 'string';
  }
}
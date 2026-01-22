import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { CredentialTemplate } from '../templates/entities/credential-template.entity';
import { User } from '../../users/entities/user.entity';

@Entity('issued_credentials')
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CredentialTemplate, template => template.credentials)
  template: CredentialTemplate;

  @Column()
  holderDid: string;

  @Column('simple-json')
  claims: Record<string, any>;

  @Column('simple-json', { nullable: true })
  credentialData: Record<string, any>;

  @Column({ nullable: true })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  transactionId: string;

  @CreateDateColumn()
  issuedAt: Date;

  @ManyToOne(() => User, user => user.issuedCredentials)
  issuer: User;
}
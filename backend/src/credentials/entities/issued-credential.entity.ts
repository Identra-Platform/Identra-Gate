import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('issued_credentials')
export class IssuedCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  credentialId: string;

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
}
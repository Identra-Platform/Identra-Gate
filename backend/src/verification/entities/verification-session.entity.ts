import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class VerificationSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.verifications)
  verifier: User;

  @Column('simple-json')
  request: {
    id: string;
    data: string;
  }

  @Column('simple-json')
  requestedCredentials: {
    credentialType: string;
    fields: string[];
  }[];

  @Column({
    type: 'simple-json',
    nullable: true
  })
  results?: Record<string, {
    status: string;
    claims?: Array<Record<string, any>>;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;
}
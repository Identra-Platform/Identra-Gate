import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { LoginAttempt } from '../../auth/entities/login-attempt.entity';
import { ActivityLog } from '../../audit/entities/activity.entity';
import { UserRole } from '../types/user-role.type';
import { Credential } from 'src/credentials/entities/credential.entity';
import { VerificationSession } from 'src/verification/entities/verification-session.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    array: true,
    enum: UserRole,
    default: [UserRole.Verifier]
  })
  roles: UserRole[];

  @Column()
  password: string;

  @OneToMany(() => LoginAttempt, loginAttempt => loginAttempt.user)
  loginAttempts: LoginAttempt[];

  @OneToMany(() => ActivityLog, activityLog => activityLog.user)
  activities: ActivityLog[];

  @OneToMany(() => Credential, credential => credential.issuer)
  issuedCredentials: Credential[];

  @OneToMany(() => VerificationSession, session => session.verifier)
  verifications: VerificationSession[];

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

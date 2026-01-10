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

export enum UserRole {
  Admin = 'admin',
  Verifier = 'verifier',
  Issuer = 'issuer'
}

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

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

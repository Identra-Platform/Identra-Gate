import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

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
    enum: UserRole
  })
  roles: UserRole[];

  @Column({ select: false })
  @Exclude()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

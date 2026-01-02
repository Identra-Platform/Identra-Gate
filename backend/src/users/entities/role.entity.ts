import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

export enum UserRole {
  Admin = 'admin',
  Issuer = 'issuer',
  Verifier = 'verifier',
}

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text',
    enum: UserRole,
    default: UserRole.Verifier,
  })
  role: UserRole;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}

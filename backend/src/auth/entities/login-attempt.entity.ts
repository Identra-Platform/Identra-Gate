import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.loginAttempts, {  onDelete: 'CASCADE', nullable: true })
  user?: User;

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;

  @Column({ default: false })
  success: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Column({ nullable: true })
  failureReason: string;
}
import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum ActivityStatus {
  Success = 'success',
  Error = 'error'
}

export enum ActivityAction {
  Login = 'login',
  Logout = 'logout'
}

@Entity()
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => User, user => user.activities)
  user: User;

  @Column({
    type: 'enum',
    enum: ActivityAction
  })
  action: ActivityAction;

  @Column({
    type: 'enum',
    enum: ActivityStatus
  })
  status: ActivityStatus;

  @Column({ nullable: true })
  error: string;
}
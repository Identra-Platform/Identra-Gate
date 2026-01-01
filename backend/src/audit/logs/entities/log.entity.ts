import { User } from "../../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Verbose = 'verbose'
}

@Entity()
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'enum', enum: LogLevel })
  level: LogLevel;

  @Column()
  message: string;

  @ManyToOne(() => User, user => user.logs)
  user: User;
}
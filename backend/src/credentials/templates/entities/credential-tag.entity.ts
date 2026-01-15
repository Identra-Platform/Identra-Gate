import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { CredentialTemplate } from "./credential-template.entity";

@Entity()
export class CredentialTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => CredentialTemplate, template => template.tags)
  templates: CredentialTemplate[];

  @CreateDateColumn()
  createdAt: Date;
}
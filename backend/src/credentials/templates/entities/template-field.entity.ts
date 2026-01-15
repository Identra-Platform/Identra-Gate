import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CredentialTemplate } from "./credential-template.entity";

@Entity()
export class TemplateField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('simple-json')
  path: (string | number)[];

  @Column()
  required: boolean;

  @Column({
    type: 'enum',
    enum: ['string', 'number', 'date', 'select', 'boolean', 'array', 'object'],
    default: 'string'
  })
  type: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  pattern?: string;

  @Column({ type: 'decimal', nullable: true })
  min?: number;

  @Column({ type: 'decimal', nullable: true })
  max?: number;

  @Column('simple-json', { nullable: true })
  options?: string[];

  @Column('simple-json', { nullable: true })
  defaultValue?: any;

  @ManyToOne(() => CredentialTemplate, template => template.fields, {
    onDelete: 'CASCADE'
  })
  template: CredentialTemplate;

  @Column()
  order: number;

  @Column({ nullable: true })
  group?: string;
}
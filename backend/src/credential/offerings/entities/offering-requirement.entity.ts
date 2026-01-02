import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Offering } from "./offering.entity";

export type OfferingRequirementType = 'document' | 'credential' | 'information' | 'consent';
export type OfferingRequirementFormat = 'image' | 'pdf' | 'text' | 'credential';

@Entity()
export class OfferingRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Offering, offer => offer.requirements)
  offering: Offering;

  @Column()
  type: OfferingRequirementType;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  required: boolean;

  @Column()
  format: OfferingRequirementFormat;
}
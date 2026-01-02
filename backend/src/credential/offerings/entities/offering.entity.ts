import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OfferingRequirement } from './offering-requirement.entity';

@Entity()
export class Offering {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  category: string;

  @OneToMany(() => OfferingRequirement, (req) => req.offering, {
    cascade: true,
    eager: true,
  })
  requirements: OfferingRequirement[];
}

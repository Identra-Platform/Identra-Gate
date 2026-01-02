import { Injectable } from '@nestjs/common';
import { CreateOfferingDto } from './dto/create-offering.dto';
import { UpdateOfferingDto } from './dto/update-offering.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Offering } from './entities/offering.entity';
import { Repository } from 'typeorm';
import { OfferingRequirement } from './entities/offering-requirement.entity';

@Injectable()
export class OfferingsService {
  constructor(
    @InjectRepository(Offering)
    private readonly offeringRepository: Repository<Offering>,
    @InjectRepository(OfferingRequirement)
    private readonly offeringRequirementRepository: Repository<OfferingRequirement>,
  ) {}

  async create(createOfferingDto: CreateOfferingDto) {
    const offeringEntity = this.offeringRepository.create({
      name: createOfferingDto.name,
      description: createOfferingDto.description,
      category: createOfferingDto.category
    });
    const offering = await this.offeringRepository.save(offeringEntity);

    if (createOfferingDto.requirements.length > 0) {
      const requirements = createOfferingDto.requirements.map((reqDto, index) => {
        const requirement = this.offeringRequirementRepository.create({
          type: reqDto.type,
          title: reqDto.title,
          description: reqDto.description,
          required: reqDto.required !== undefined ? reqDto.required : true,
          format: reqDto.format,
          offering
        });
        return requirement;
      });

      offering.requirements = await this.offeringRequirementRepository.save(requirements);
    }

    return offering;
  }

  async findAll() {
    return this.offeringRepository.find();
  }

  async findOne(id: string) {
    return this.offeringRepository.findOneOrFail({
      where: {id}
    });
  }

  async update(id: string, updateOfferingDto: UpdateOfferingDto) {
    const offering = await this.findOne(id);

    if (updateOfferingDto.requirements !== undefined) {
      await this.offeringRequirementRepository.delete({ id });

      if (updateOfferingDto.requirements.length > 0) {
        const requirements = updateOfferingDto.requirements.map((reqDto, index) => {
          const requirement = this.offeringRequirementRepository.create({
            offering: offering,
            type: reqDto.type,
            title: reqDto.title,
            description: reqDto.description,
            required: reqDto.required !== undefined ? reqDto.required : true,
            format: reqDto.format
          });
          return requirement;
        });

        offering.requirements = await this.offeringRequirementRepository.save(requirements);
      } else {
        offering.requirements = [];
      }
    }

    Object.assign(offering, updateOfferingDto);
    return await this.offeringRepository.save(offering);
  }

  async remove(id: string) {
    const offering = await this.findOne(id);
    await this.offeringRepository.remove(offering);
  }
}

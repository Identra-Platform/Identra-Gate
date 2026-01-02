import { Module } from '@nestjs/common';
import { OfferingsService } from './offerings.service';
import { OfferingsController } from './offerings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offering } from './entities/offering.entity';
import { OfferingRequirement } from './entities/offering-requirement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offering, OfferingRequirement])],
  controllers: [OfferingsController],
  providers: [OfferingsService],
})
export class OfferingsModule {}

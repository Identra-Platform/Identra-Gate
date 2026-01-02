import { Module } from '@nestjs/common';
import { OfferingsModule } from './offerings/offerings.module';

@Module({
  imports: [OfferingsModule]
})
export class CredentialModule {}

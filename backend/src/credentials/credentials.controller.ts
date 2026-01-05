import { Body, Controller, Post } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CreateCredentialOfferDto } from './dto/credential-offer.dto';

@Controller('credentials')
export class CredentialsController {
  constructor(
    private readonly credentialsService: CredentialsService
  ) {}

  @Post('offers')
  createCredentialOffer(@Body() createCredentialOfferDto: CreateCredentialOfferDto) {
    return this.credentialsService.createCredentialOffer(createCredentialOfferDto);
  }
}

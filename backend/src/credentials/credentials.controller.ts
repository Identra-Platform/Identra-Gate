import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CreateCredentialOfferDto } from './dto/credential-offer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('Credentials')
@Controller('credentials')
export class CredentialsController {
  constructor(
    private readonly credentialsService: CredentialsService
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ 
    summary: 'Create credential offer', 
    description: 'Create a verifiable credential offer for a holder' 
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateCredentialOfferDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Credential offer created successfully',
    schema: {
      example: {
        id: 'cred_offer_123',
        credentialId: 'credential_123',
        holderDid: 'did:example:123456789abcdefghi',
        claims: {
          name: 'John Doe',
          age: 30,
          email: 'john@example.com'
        },
        status: 'pending',
        createdAt: '2024-01-15T10:30:00Z',
        expiration: '2024-02-15T10:30:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  createCredentialOffer(@Body() createCredentialOfferDto: CreateCredentialOfferDto) {
    return this.credentialsService.createCredentialOffer(createCredentialOfferDto);
  }
}
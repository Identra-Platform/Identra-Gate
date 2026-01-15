import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CreateCredentialOfferDto } from './dto/credential-offer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';

@ApiTags('Credentials')
@Controller('credentials')
export class CredentialsController {
  constructor(
    private readonly credentialsService: CredentialsService
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
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
  createCredentialOffer(
    @Req() request: Request,
    @Body() createCredentialOfferDto: CreateCredentialOfferDto
  ) {
    return this.credentialsService.createCredentialOffer(
      (request.user as any).id,
      createCredentialOfferDto
    );
  }

  @Get(':id')
  getCredentialById(
    @Param('id') id: string
  ) {
    return this.credentialsService.getCredentialById(id);
  }

  @Get()
  getAllCredential() {
    return this.credentialsService.getAllCredentials();
  }
}
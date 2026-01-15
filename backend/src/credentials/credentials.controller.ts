import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CreateCredentialOfferDto } from './dto/credential-offer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/types/user-role.type';

@ApiTags('Credentials')
@Controller('credentials')
export class CredentialsController {
  constructor(
    private readonly credentialsService: CredentialsService
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Issuer)
  @Post()
  createCredentialOffer(
    @Req() request: Request,
    @Body() createCredentialOfferDto: CreateCredentialOfferDto
  ) {
    return this.credentialsService.createCredentialOffer(
      (request.user as any).id,
      createCredentialOfferDto
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Issuer)
  @Get(':id')
  getCredentialById(
    @Param('id') id: string
  ) {
    return this.credentialsService.getCredentialById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Issuer)
  @Get()
  getAllCredential() {
    return this.credentialsService.getAllCredentials();
  }
}
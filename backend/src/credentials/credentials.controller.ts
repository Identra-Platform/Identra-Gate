import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CreateCredentialOfferDto } from './dto/credential-offer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/types/user-role.type';
import { ActivityAction } from 'src/audit/entities/activity.entity';
import { ActivityLog } from 'src/audit/decorators/activity-log.decorator';

@ApiTags('Credentials')
@Controller('credentials')
export class CredentialsController {
  constructor(
    private readonly credentialsService: CredentialsService
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Issuer)
  @ActivityLog({
    action: ActivityAction.IssueCredential
  })
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
  async getAllCredential() {
    const data = await this.credentialsService.getAllCredentials();
    console.log(JSON.stringify(data, null, 2));
    return data;
  }
}
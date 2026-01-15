import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { CreateAuthorizationRequestDto } from './dto/verification-request.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/types/user-role.type';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Verifier)
  @Get()
  getVerificationSessions() {
    return this.verificationService.getVerificationSessions();
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Verifier)
  @Post()
  createRequest(
    @Req() req: Request,
    @Body() createAuthorizationRequestDto: CreateAuthorizationRequestDto
  ) {
    return this.verificationService.authorize((req.user as any).id, createAuthorizationRequestDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.Admin, UserRole.Verifier)
  @Get('/:id')
  getVerificationResponse(@Param('id') id: string) {
    return this.verificationService.getVerificationResults(id);
  }
}
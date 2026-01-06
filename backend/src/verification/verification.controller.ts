import { Body, Controller, Post } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { CreateAuthorizationRequestDto } from './dto/verification-request.dto';

@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService
  ) {}

  @Post()
  createRequest(@Body() createAuthorizationRequestDto: CreateAuthorizationRequestDto) {
    return this.verificationService.authorize(createAuthorizationRequestDto);
  }
}

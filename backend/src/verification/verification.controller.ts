import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { CreateAuthorizationRequestDto } from './dto/verification-request.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService
  ) {}

  @Get()
  getVerificationSessions() {
    return this.verificationService.getVerificationSessions();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ 
    summary: 'Create verification request', 
    description: 'Create an authorization request for credential verification' 
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateAuthorizationRequestDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Verification request created successfully',
    schema: {
      example: {
        id: 'ver_req_123',
        status: 'pending',
        credentialRequests: [
          {
            requestName: 'Identity Verification',
            credentialType: 'IdentityCredential',
            fields: [
              {
                fieldName: 'fullName',
                fieldType: 'text',
                path: '$.name',
                required: true
              }
            ],
            settings: {
              allowMultipleUse: true
            }
          }
        ],
        metadata: {
          purpose: 'Identity verification for KYC',
          expirationDays: 30
        },
        createdAt: '2024-01-15T10:30:00Z',
        expiration: '2024-02-14T10:30:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createRequest(
    @Req() req: Request,
    @Body() createAuthorizationRequestDto: CreateAuthorizationRequestDto
  ) {
    return this.verificationService.authorize((req.user as any).id, createAuthorizationRequestDto);
  }

  @Get('/:id')
  @ApiOperation({ 
    summary: 'Get verification request', 
    description: 'Retrieve verification request details by ID' 
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Verification request ID', example: 'ver_req_123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Verification request retrieved',
    schema: {
      example: {
        id: 'ver_req_123',
        status: 'completed',
        credentialRequests: [
          {
            requestName: 'Identity Verification',
            credentialType: 'IdentityCredential',
            fields: [
              {
                fieldName: 'fullName',
                fieldType: 'text',
                path: '$.name',
                required: true,
                value: 'John Doe'
              }
            ],
            settings: {
              allowMultipleUse: true
            }
          }
        ],
        metadata: {
          purpose: 'Identity verification for KYC',
          expirationDays: 30
        },
        createdAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T10:35:00Z',
        expiration: '2024-02-14T10:30:00Z',
        result: {
          verified: true,
          confidence: 0.95
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Verification request not found' })
  getVerificationResponse(@Param('id') id: string) {
    return this.verificationService.getVerificationResults(id);
  }
}
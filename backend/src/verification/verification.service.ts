import { Injectable } from '@nestjs/common';
import { CreateAuthorizationRequestDto } from './dto/verification-request.dto';
import { DcqlQuery } from '@credo-ts/core';
import { v4 as uuidv4 } from 'uuid';
import { OpenId4VcService } from 'src/credo/openid4vc.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly openId4VcService: OpenId4VcService
  ) {}

  async authorize(createAuthorizationRequestDto: CreateAuthorizationRequestDto) {
    const dcqlQuery = this.convertToDcql(createAuthorizationRequestDto);
    return this.openId4VcService.createAuthorizationRequest(dcqlQuery);
  }

  private convertToDcql(dto: CreateAuthorizationRequestDto): DcqlQuery {
    const credentials = dto.credentialRequests.map((credRequest, index) => {
      const id = uuidv4();

      const claims = credRequest.fields
        .map(field => {
          const pathArray = field.path.includes(".")
            ? field.path.split('.')
            : [field.path];

          const claim = {
            path: pathArray
          };

          if (field.allowedValues && field.allowedValues.length > 0) {
            return {
              ...claim,
              values: field.allowedValues
            }
          }

          return claim;
        });
      
      const credential = {
        id, format: 'dc+sd-jwt' as const,
        meta: {
          vct_values: [credRequest.credentialType]
        },
        multiple: credRequest.settings.allowMultipleUse,
      };

      if (claims && claims.length > 0) {
        return {
          ...credential,
          claims
        };
      }

      return credential;
    });

    return {
      credentials
    };
  }
}

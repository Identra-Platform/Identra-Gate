import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateCredentialOfferDto {
  @ApiProperty({
    description: 'Credential identifier',
    example: 'credential_123',
  })
  @IsString()
  credentialId: string;

  @ApiProperty({
    description: 'Holder DID (Decentralized Identifier)',
    example: 'did:example:123456789abcdefghi',
  })
  @IsString()
  holderDid: string;
  
  @ApiProperty({
    description: 'Credential claims data',
    example: {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com'
    },
  })
  @IsObject()
  claims: Record<string, any>;
}
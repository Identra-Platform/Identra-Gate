import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

export enum FieldType {
  Text = 'text',
  Date = 'date',
  Number = 'number',
  Select = 'select'
}

export class CredentialField {
  @ApiProperty({
    description: 'Field name',
    example: 'fullName',
  })
  @IsString()
  fieldName: string;

  @ApiProperty({
    description: 'Field data type',
    enum: FieldType,
    example: FieldType.Text,
  })
  @IsEnum(FieldType)
  fieldType: FieldType;

  @ApiProperty({
    description: 'JSON path to the field in credential',
    example: '$.name',
  })
  @IsString()
  path: string;

  @ApiPropertyOptional({
    description: 'Allowed values for select field type',
    example: ['value1', 'value2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedValues?: string[];

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
  })
  @IsBoolean()
  required: boolean;
}

export class CredentialRequest {
  @ApiProperty({
    description: 'Request name',
    example: 'Identity Verification',
  })
  @IsString()
  requestName: string;

  @ApiProperty({
    description: 'Type of credential requested',
    example: 'IdentityCredential',
  })
  @IsString()
  credentialType: string;

  @ApiProperty({
    description: 'Requested credential fields',
    type: [CredentialField],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CredentialField)
  fields: CredentialField[];

  @ApiProperty({
    description: 'Request settings',
    example: {
      allowMultipleUse: true,
    },
  })
  @IsObject()
  settings: {
    allowMultipleUse: boolean;
  }
}

export class CreateAuthorizationRequestDto {
  @ApiProperty({
    description: 'List of credential requests',
    type: [CredentialRequest],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CredentialRequest)
  credentialRequests: CredentialRequest[];

  @ApiProperty({
    description: 'Request metadata',
    example: {
      purpose: 'Identity verification for KYC',
      expirationDays: 30,
    },
  })
  @IsObject()
  metadata: {
    purpose?: string;
    expirationDays?: number;
  };
}
import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

export enum FieldType {
  Text = 'text',
  Date = 'date',
  Number = 'number',
  Select = 'select'
}

export class CredentialField {
  @IsString()
  fieldName: string;

  @IsEnum(FieldType)
  fieldType: FieldType;

  @IsString()
  path: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedValues?: string[];

  @IsBoolean()
  required: boolean;
}

export class CredentialRequest {
  @IsString()
  requestName: string;

  @IsString()
  credentialType: string;

  @IsArray()
  @ValidateNested({ each: true })
  fields: CredentialField[];

  @IsObject()
  settings: {
    allowMultipleUse: boolean;
  }
}

export class CreateAuthorizationRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  credentialRequests: CredentialRequest[];

  @IsObject()
  metadata: {
    purpose?: string;
    expirationDays?: number;
  }
}
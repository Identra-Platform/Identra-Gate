import { 
  IsString, IsOptional, IsBoolean, IsArray, 
  ValidateNested, IsNumber, IsObject, IsEnum, 
  ArrayNotEmpty, IsUrl 
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFieldDto {
  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean = true;

  @IsEnum(['string', 'number', 'date', 'select', 'boolean', 'array', 'object'])
  type: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  pattern?: string;

  @IsNumber()
  @IsOptional()
  min?: number;

  @IsNumber()
  @IsOptional()
  max?: number;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsOptional()
  defaultValue?: any;

  @IsNumber()
  @IsOptional()
  order?: number = 0;

  @IsString()
  @IsOptional()
  group?: string;
}

export class CreateDisplayDto {
  @IsString()
  background: string;

  @IsString()
  @IsOptional()
  textColor?: string;

  @IsUrl()
  @IsOptional()
  logo?: string;
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(['sd-jwt', 'jwt_vc_json', 'jwt_vc_json-ld', 'ldp_vc'])
  @IsOptional()
  format?: string = 'sd-jwt';

  @IsString()
  credentialType: string;

  @ValidateNested()
  @Type(() => CreateDisplayDto)
  display: CreateDisplayDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDto)
  @IsOptional()
  fields?: CreateFieldDto[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;

  @IsNumber()
  @IsOptional()
  validityDays?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
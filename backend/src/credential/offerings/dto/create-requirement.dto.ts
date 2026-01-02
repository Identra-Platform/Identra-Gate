import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type {
  OfferingRequirementFormat,
  OfferingRequirementType,
} from '../entities/offering-requirement.entity';

export class CreateRequirementDto {
  @IsEnum(['document', 'credential', 'information', 'consent'])
  @IsNotEmpty()
  type: OfferingRequirementType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean = true;

  @IsEnum(['image', 'pdf', 'text', 'credential'])
  @IsOptional()
  format?: OfferingRequirementFormat;
}

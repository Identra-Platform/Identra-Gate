import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRequirementDto } from './create-requirement.dto';

export class CreateOfferingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRequirementDto)
  @IsOptional()
  requirements: CreateRequirementDto[] = [];
}

import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Strong password (minimum 8 characters with uppercase, lowercase, number and special character)',
    example: 'StrongP@ss123',
  })
  @IsStrongPassword({
    minLength: 8,
  })
  password: string;

  @ApiProperty({
    description: 'User roles',
    example: [UserRole.Admin, UserRole.Verifier],
    enum: UserRole,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}
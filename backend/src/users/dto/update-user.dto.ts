import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional } from 'class-validator';
import { UserRole } from '../entities/role.entity';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'updated@example.com',
  })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'Jane Doe',
  })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Strong password',
    example: 'NewP@ss123',
  })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'User roles',
    example: [UserRole.Verifier],
    enum: UserRole,
    isArray: true,
  })
  @IsOptional()
  roles?: UserRole[];
}

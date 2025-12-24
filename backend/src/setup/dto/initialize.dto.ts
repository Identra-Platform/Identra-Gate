import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsString, Length, Matches, Max, MaxLength, Min, MinLength, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: 'passwordMatch', async: false })
export class PasswordMatchConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, validationArguments: ValidationArguments): Promise<boolean> | boolean {
    const obj = validationArguments.object as any;
    return obj.password === confirmPassword;
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return 'Passwords do not match';
  }
}

@ValidatorConstraint({ name: 'passwordStrength', async: false })
export class PasswordStrengthConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (!/[A-Z]/.test(password)) {
      return false;
    }
    if (!/[a-z]/.test(password)) {
      return false;
    }
    if (!/\d/.test(password)) {
      return false;
    }
    if (!/[@$!%*?&]/.test(password)) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
}

export class InitializeDto {
  @ApiProperty({
    example: 'My Organization',
    description: 'Name of your organization/server',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  serverName: string;

  @ApiProperty({
    example: 'admin@example.com',
    description: 'Admin email address',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  adminEmail: string;

  @ApiProperty({
    example: 'Admin User',
    description: 'Full name of the admin',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  adminName: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Admin password (minimum 12 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(100)
  @Validate(PasswordStrengthConstraint)
  @Matches(/^[^\s]+$/, {
    message: 'Password cannot contain spaces',
  })
  adminPassword: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password confirmation (must match password)',
  })
  @IsString()
  @IsNotEmpty()
  @Validate(PasswordMatchConstraint)
  confirmPassword: string;
}

export class InitializeResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success status',
  })
  success: boolean;

  @ApiProperty({
    example: 'apple brave chair dance eagle flame grape house image jolly knife lemon money night ocean piano queen river sunny tiger unity voice world youth',
    description: 'Recovery phrase (ONLY shown once!)',
  })
  recoveryPhrase: string;

  @ApiProperty({
    example: 'Save this recovery phrase securely. It will not be shown again.',
    description: 'Warning message',
  })
  message: string;

  @ApiProperty({
    description: 'Admin user details',
  })
  adminUser: {
    id: string;
    email: string;
    name: string;
  };
}

export class SetupErrorResponseDto {
  @ApiProperty({
    example: false,
    description: 'Success status',
  })
  success: boolean;

  @ApiProperty({
    example: 'Setup already completed',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({
    example: 'SETUP_ALREADY_COMPLETED',
    description: 'Error code',
  })
  errorCode: string;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00Z',
    description: 'When setup was completed',
  })
  completedAt?: string;
}

export class ValidationGroups {
  static readonly CREATE = 'create';
  static readonly UPDATE = 'update';
}
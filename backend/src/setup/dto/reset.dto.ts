import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsString, Matches, MaxLength, MinLength, Validate, ValidateIf, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: 'requiresConfirmation', async: false })
export class RequiresConfirmationConstraint implements ValidatorConstraintInterface {
  validate(value: boolean, args: ValidationArguments) {
    const obj = args.object as any;
    if (value === true) {
      return !!obj.adminPassword && !!obj.recoveryPhrase;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'When confirming reset, both adminPassword and recoveryPhrase are required';
  }
}

export class ResetSetupDto {
  @ApiProperty({
    example: 'CurrentAdminPass123!',
    description: 'Current admin password for authentication',
  })
  @ValidateIf(o => o.confirmReset === true)
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  adminPassword: string;

  @ApiProperty({
    example: 'apple brave chair dance eagle flame grape house image jolly knife lemon',
    description: 'Current recovery phrase (24 words)',
  })
  @ValidateIf(o => o.confirmReset === true)
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Recovery phrase can only contain letters and spaces',
  })
  @Matches(/^(\w+\s+){23}\w+$/, {
    message: 'Recovery phrase must be exactly 24 words',
  })
  recoveryPhrase: string;

  @ApiProperty({
    example: true,
    description: 'Confirmation flag - MUST be true to proceed with reset',
  })
  @IsBoolean()
  @Validate(RequiresConfirmationConstraint)
  confirmReset: boolean;
}

export class ResetSetupResponseDto {
  @ApiProperty({
    example: true,
    description: 'Reset operation success status',
  })
  success: boolean;

  @ApiProperty({
    example: 'Setup has been reset. Restart required.',
    description: 'Reset operation message',
  })
  message: string;

  @ApiProperty({
    example: 'restart_token_xyz789',
    description: 'Token to use for restart confirmation',
  })
  restartToken: string;
}
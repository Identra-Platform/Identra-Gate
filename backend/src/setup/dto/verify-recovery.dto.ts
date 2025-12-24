import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class VerifyRecoveryDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email address associated with the account',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'apple brave chair dance eagle flame grape house image jolly knife lemon money night ocean piano queen river sunny tiger unity voice world youth',
    description: 'Recovery phrase (12 or 24 words separated by spaces)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Recovery phrase can only contain letters and spaces',
  })
  recoveryPhrase: string;
}

export class VerifyRecoveryResponseDto {
  @ApiProperty({
    example: true,
    description: 'Verification success status',
  })
  valid: boolean;

  @ApiProperty({
    example: 'reset_token_abc123',
    description: 'Token for the next step (if applicable)',
  })
  token: string;

  @ApiProperty({
    example: 'Recovery phrase verified successfully',
    description: 'Result message',
  })
  message: string;
}
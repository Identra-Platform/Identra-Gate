import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateVerificationRequestDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredClaims?: string[];

  @IsOptional()
  @IsNumber()
  expiresIn?: number;
}

export class CreateVerificationRequestReponseDto {
  @IsString()
  requestId: string;

  @IsString()
  requestUrl: string;

  @IsString()
  qrCodeDataUrl: string;

  @IsString()
  expiresAt: string;
}
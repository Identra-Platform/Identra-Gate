import { IsBoolean, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateCredentialOfferDto {
  @IsString()
  credentialId: string;

  @IsString()
  @IsOptional()
  holderDid?: string;
  
  @IsObject()
  claims: Record<string, any>;
  
  @IsOptional()
  @IsBoolean()
  pinRequired?: boolean = true;
  
  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(8)
  pinLength?: number = 4;
}
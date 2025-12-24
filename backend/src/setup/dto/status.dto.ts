import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class StatusDto {
  @ApiProperty({
    example: true,
    description: 'Whether setup is required',
  })
  requiresSetup: boolean;

  @ApiPropertyOptional({
    example: 'My Organization',
    description: 'Server/organization name (if setup is completed)',
  })
  servername?: string;

  @ApiProperty({
    example: '1.0.0',
    description: 'Server version',
  })
  version: string;
}
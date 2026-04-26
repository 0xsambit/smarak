import { IsInt, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProtectionStatus, RiskLevel } from '../../../schemas/site.schema.js';

export class QuerySitesDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state;

  @ApiPropertyOptional({ enum: Object.values(RiskLevel) })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel;

  @ApiPropertyOptional({ enum: Object.values(ProtectionStatus) })
  @IsOptional()
  @IsEnum(ProtectionStatus)
  protectionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search;

  @ApiPropertyOptional({
    description: 'When true, only archived sites are returned',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  archived = false;
}

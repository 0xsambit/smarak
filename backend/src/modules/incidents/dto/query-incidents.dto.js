import { IsInt, IsOptional, IsEnum, IsMongoId, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentStatus, IncidentSeverity } from '../../../schemas/incident.schema.js';

export class QueryIncidentsDto {
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
  @IsMongoId()
  siteId;

  @ApiPropertyOptional({ enum: Object.values(IncidentStatus) })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status;

  @ApiPropertyOptional({ enum: Object.values(IncidentSeverity) })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity;

  @ApiPropertyOptional({
    description: 'When true, only archived incidents are returned',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  archived = false;
}

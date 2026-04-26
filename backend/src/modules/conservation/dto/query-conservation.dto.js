import { IsInt, IsOptional, IsEnum, IsMongoId, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConservationStatus } from '../../../schemas/conservation.schema.js';

export class QueryConservationDto {
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

  @ApiPropertyOptional({ enum: Object.values(ConservationStatus) })
  @IsOptional()
  @IsEnum(ConservationStatus)
  status;

  @ApiPropertyOptional({
    description: 'When true, only archived conservation projects are returned',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  archived = false;
}

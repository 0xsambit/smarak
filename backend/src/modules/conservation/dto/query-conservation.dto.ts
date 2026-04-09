import { IsInt, IsOptional, IsEnum, IsMongoId, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConservationStatus } from '@schemas/conservation.schema';

export class QueryConservationDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  siteId?: string;

  @ApiPropertyOptional({ enum: ConservationStatus })
  @IsOptional()
  @IsEnum(ConservationStatus)
  status?: ConservationStatus;

  @ApiPropertyOptional({
    description: 'When true, only archived conservation projects are returned',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  archived?: boolean = false;
}

import { IsInt, IsOptional, IsEnum, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalStatus, ApprovalType } from '../../../schemas/approval.schema.js';

export class QueryApprovalsDto {
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

  @ApiPropertyOptional({ enum: Object.values(ApprovalStatus) })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status;

  @ApiPropertyOptional({ enum: Object.values(ApprovalType) })
  @IsOptional()
  @IsEnum(ApprovalType)
  type;

  @ApiPropertyOptional({
    description: 'When true, only archived approvals are returned',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  archived = false;
}

import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalStatus } from '../../../schemas/approval.schema.js';

export class ReviewApprovalDto {
  @ApiProperty({ enum: Object.values(ApprovalStatus) })
  @IsEnum(ApprovalStatus)
  status;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNotes;
}

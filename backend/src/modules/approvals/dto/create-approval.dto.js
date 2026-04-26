import { IsString, IsEnum, IsMongoId, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalType } from '../../../schemas/approval.schema.js';

export class CreateApprovalDto {
  @ApiProperty({ enum: Object.values(ApprovalType) })
  @IsEnum(ApprovalType)
  type;

  @ApiProperty({ example: 'Conservation project approval request' })
  @IsString()
  title;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description;

  @ApiProperty()
  @IsMongoId()
  referenceId;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPriority;
}

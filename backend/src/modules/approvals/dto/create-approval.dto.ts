import { IsString, IsEnum, IsMongoId, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalType } from '@schemas/approval.schema';

export class CreateApprovalDto {
  @ApiProperty({ enum: ApprovalType })
  @IsEnum(ApprovalType)
  type: ApprovalType;

  @ApiProperty({ example: 'Conservation project approval request' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsMongoId()
  referenceId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPriority?: boolean;
}

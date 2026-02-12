import { IsString, IsEnum, IsMongoId, IsNumber, IsDateString, IsOptional, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConservationStatus } from '@schemas/conservation.schema';

export class CreateConservationDto {
  @ApiProperty()
  @IsMongoId()
  siteId: string;

  @ApiProperty({ example: 'Structural Restoration' })
  @IsString()
  issueType: string;

  @ApiProperty({ example: 'Taj Mahal Minaret Restoration Project' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Restoration of damaged marble on north minaret' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  beforeImages?: string[];

  @ApiProperty({ example: 'ASI Heritage Conservation Pvt Ltd' })
  @IsString()
  contractor: string;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiProperty({ enum: ConservationStatus })
  @IsEnum(ConservationStatus)
  status: ConservationStatus;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

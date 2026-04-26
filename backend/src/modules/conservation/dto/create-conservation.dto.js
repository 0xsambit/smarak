import { IsString, IsEnum, IsMongoId, IsNumber, IsDateString, IsOptional, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConservationStatus } from '../../../schemas/conservation.schema.js';

export class CreateConservationDto {
  @ApiProperty()
  @IsMongoId()
  siteId;

  @ApiProperty({ example: 'Structural Restoration' })
  @IsString()
  issueType;

  @ApiProperty({ example: 'Taj Mahal Minaret Restoration Project' })
  @IsString()
  title;

  @ApiProperty({ example: 'Restoration of damaged marble on north minaret' })
  @IsString()
  description;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  beforeImages;

  @ApiPropertyOptional({ type: [String], description: 'GridFS file ids for before images' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  beforeImageFileIds;

  @ApiProperty({ example: 'ASI Heritage Conservation Pvt Ltd' })
  @IsString()
  contractor;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  @Min(0)
  budget;

  @ApiProperty({ enum: Object.values(ConservationStatus) })
  @IsEnum(ConservationStatus)
  status;

  @ApiProperty()
  @IsDateString()
  startDate;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate;
}

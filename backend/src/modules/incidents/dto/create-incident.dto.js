import { IsString, IsEnum, IsMongoId, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentType, IncidentSeverity } from '../../../schemas/incident.schema.js';

export class CreateIncidentDto {
  @ApiProperty()
  @IsMongoId()
  siteId;

  @ApiProperty({ enum: Object.values(IncidentType) })
  @IsEnum(IncidentType)
  type;

  @ApiProperty({ enum: Object.values(IncidentSeverity) })
  @IsEnum(IncidentSeverity)
  severity;

  @ApiProperty({ example: 'Cracks observed in the north wall' })
  @IsString()
  description;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images;

  @ApiPropertyOptional({ type: [String], description: 'GridFS file ids for incident images' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  imageFileIds;
}

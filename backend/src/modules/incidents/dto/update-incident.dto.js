import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentStatus } from '../../../schemas/incident.schema.js';
import { CreateIncidentDto } from './create-incident.dto.js';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @ApiPropertyOptional({ enum: Object.values(IncidentStatus) })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolutionNotes;
}

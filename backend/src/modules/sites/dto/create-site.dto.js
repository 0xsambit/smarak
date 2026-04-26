import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProtectionStatus, RiskLevel } from '../../../schemas/site.schema.js';

class CoordinatesDto {
  @ApiProperty({ example: 77.2167 })
  @IsNumber()
  longitude;

  @ApiProperty({ example: 28.6139 })
  @IsNumber()
  latitude;
}

export class CreateSiteDto {
  @ApiProperty({ example: 'Taj Mahal' })
  @IsString()
  name;

  @ApiProperty({ example: 'Uttar Pradesh' })
  @IsString()
  state;

  @ApiProperty({ example: 'Agra' })
  @IsString()
  district;

  @ApiProperty({ type: CoordinatesDto })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates;

  @ApiProperty({ enum: Object.values(ProtectionStatus) })
  @IsEnum(ProtectionStatus)
  protectionStatus;

  @ApiProperty({ enum: Object.values(RiskLevel) })
  @IsEnum(RiskLevel)
  riskLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastInspectionDate;

  @ApiProperty({ example: 40000 })
  @IsNumber()
  visitorCapacity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description;
}

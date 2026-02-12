import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProtectionStatus, RiskLevel } from '@schemas/site.schema';

class CoordinatesDto {
  @ApiProperty({ example: 77.2167 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 28.6139 })
  @IsNumber()
  latitude: number;
}

export class CreateSiteDto {
  @ApiProperty({ example: 'Taj Mahal' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Uttar Pradesh' })
  @IsString()
  state: string;

  @ApiProperty({ example: 'Agra' })
  @IsString()
  district: string;

  @ApiProperty({ type: CoordinatesDto })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  @ApiProperty({ enum: ProtectionStatus })
  @IsEnum(ProtectionStatus)
  protectionStatus: ProtectionStatus;

  @ApiProperty({ enum: RiskLevel })
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastInspectionDate?: string;

  @ApiProperty({ example: 40000 })
  @IsNumber()
  visitorCapacity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

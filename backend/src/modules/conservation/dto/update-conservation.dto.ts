import { PartialType } from '@nestjs/swagger';
import { CreateConservationDto } from './create-conservation.dto';
import { IsOptional, IsArray, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConservationDto extends PartialType(CreateConservationDto) {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  afterImages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  completionNotes?: string;
}

import { PartialType } from '@nestjs/swagger';
import { CreateConservationDto } from './create-conservation.dto';
import { IsOptional, IsArray, IsString, IsMongoId } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConservationDto extends PartialType(CreateConservationDto) {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  afterImages?: string[];

  @ApiPropertyOptional({ type: [String], description: 'GridFS file ids for after images' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  afterImageFileIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  completionNotes?: string;
}

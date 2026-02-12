import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum DashboardScope {
  NATIONAL = 'national',
  STATE = 'state',
  SITE = 'site',
}

export class DashboardQueryDto {
  @ApiPropertyOptional({ enum: DashboardScope, default: DashboardScope.NATIONAL })
  @IsOptional()
  @IsEnum(DashboardScope)
  scope?: DashboardScope = DashboardScope.NATIONAL;

  @ApiPropertyOptional()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  siteId?: string;
}

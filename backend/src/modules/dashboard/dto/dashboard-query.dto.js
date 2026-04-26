import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const DashboardScope = {
  NATIONAL: 'national',
  STATE: 'state',
  SITE: 'site',
};

export class DashboardQueryDto {
  @ApiPropertyOptional({ enum: Object.values(DashboardScope), default: DashboardScope.NATIONAL })
  @IsOptional()
  @IsEnum(DashboardScope)
  scope = DashboardScope.NATIONAL;

  @ApiPropertyOptional()
  @IsOptional()
  state;

  @ApiPropertyOptional()
  @IsOptional()
  siteId;
}

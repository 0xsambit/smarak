import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview with KPIs and analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  getOverview(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getOverview(query);
  }
}

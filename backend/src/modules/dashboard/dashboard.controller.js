import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(ClerkAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(@Inject(DashboardService) dashboardService) {
    this.dashboardService = dashboardService;
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview with KPIs and analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  getOverview(@Query() query, @CurrentUser() user) {
    return this.dashboardService.getOverview(query, user);
  }
}

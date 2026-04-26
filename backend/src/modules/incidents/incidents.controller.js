import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service.js';
import { CreateIncidentDto } from './dto/create-incident.dto.js';
import { UpdateIncidentDto } from './dto/update-incident.dto.js';
import { QueryIncidentsDto } from './dto/query-incidents.dto.js';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@ApiTags('incidents')
@Controller('incidents')
@UseGuards(ClerkAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IncidentsController {
  constructor(@Inject(IncidentsService) incidentsService) {
    this.incidentsService = incidentsService;
  }

  @Post()
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Report a new incident' })
  @ApiResponse({ status: 201, description: 'Incident created successfully' })
  create(@Body() createIncidentDto, @CurrentUser() user) {
    return this.incidentsService.create(createIncidentDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all incidents with filters' })
  @ApiResponse({ status: 200, description: 'Incidents retrieved successfully' })
  findAll(@Query() query, @CurrentUser() user) {
    return this.incidentsService.findAll(query, user);
  }

  @Patch(':id')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Update incident status' })
  @ApiResponse({ status: 200, description: 'Incident updated successfully' })
  update(@Param('id') id, @Body() updateIncidentDto, @CurrentUser() user) {
    return this.incidentsService.updateStatus(id, updateIncidentDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Archive incident' })
  @ApiResponse({ status: 200, description: 'Incident archived successfully' })
  remove(@Param('id') id, @CurrentUser() user) {
    return this.incidentsService.remove(id, user);
  }

  @Patch(':id/restore')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Restore archived incident' })
  @ApiResponse({ status: 200, description: 'Incident restored successfully' })
  restore(@Param('id') id, @CurrentUser() user) {
    return this.incidentsService.restore(id, user);
  }
}

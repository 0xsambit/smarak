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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@schemas/user.schema';

@ApiTags('incidents')
@Controller('incidents')
@UseGuards(ClerkAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Report a new incident' })
  @ApiResponse({ status: 201, description: 'Incident created successfully' })
  create(@Body() createIncidentDto: CreateIncidentDto, @CurrentUser() user: any) {
    return this.incidentsService.create(createIncidentDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all incidents with filters' })
  @ApiResponse({ status: 200, description: 'Incidents retrieved successfully' })
  findAll(@Query() query: QueryIncidentsDto, @CurrentUser() user: any) {
    return this.incidentsService.findAll(query, user);
  }

  @Patch(':id')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Update incident status' })
  @ApiResponse({ status: 200, description: 'Incident updated successfully' })
  update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto, @CurrentUser() user: any) {
    return this.incidentsService.updateStatus(id, updateIncidentDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Archive incident' })
  @ApiResponse({ status: 200, description: 'Incident archived successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.incidentsService.remove(id, user);
  }

  @Patch(':id/restore')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Restore archived incident' })
  @ApiResponse({ status: 200, description: 'Incident restored successfully' })
  restore(@Param('id') id: string, @CurrentUser() user: any) {
    return this.incidentsService.restore(id, user);
  }
}

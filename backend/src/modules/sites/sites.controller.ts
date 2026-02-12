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
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySitesDto } from './dto/query-sites.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@schemas/user.schema';

@ApiTags('sites')
@Controller('sites')
@UseGuards(ClerkAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Create a new heritage site' })
  @ApiResponse({ status: 201, description: 'Site created successfully' })
  create(@Body() createSiteDto: CreateSiteDto) {
    return this.sitesService.create(createSiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sites with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Sites retrieved successfully' })
  findAll(@Query() query: QuerySitesDto) {
    return this.sitesService.findAll(query);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find sites near coordinates using geospatial query' })
  @ApiResponse({ status: 200, description: 'Nearby sites found' })
  findNearby(@Query() query: NearbyQueryDto) {
    return this.sitesService.findNearby(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get site by ID' })
  @ApiResponse({ status: 200, description: 'Site found' })
  findOne(@Param('id') id: string) {
    return this.sitesService.findOne(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get site statistics and related counts' })
  @ApiResponse({ status: 200, description: 'Site statistics retrieved' })
  getStatistics(@Param('id') id: string) {
    return this.sitesService.getStatistics(id);
  }

  @Patch(':id')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Update site details' })
  @ApiResponse({ status: 200, description: 'Site updated successfully' })
  update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
    return this.sitesService.update(id, updateSiteDto);
  }

  @Delete(':id')
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiOperation({ summary: 'Delete site' })
  @ApiResponse({ status: 200, description: 'Site deleted successfully' })
  remove(@Param('id') id: string) {
    return this.sitesService.remove(id);
  }
}

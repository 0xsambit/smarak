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
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
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
  create(@Body() createSiteDto: CreateSiteDto, @CurrentUser() user: any) {
    return this.sitesService.create(createSiteDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sites with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Sites retrieved successfully' })
  findAll(@Query() query: QuerySitesDto, @CurrentUser() user: any) {
    return this.sitesService.findAll(query, user);
  }

  @Patch(':id')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Update site details' })
  @ApiResponse({ status: 200, description: 'Site updated successfully' })
  update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto, @CurrentUser() user: any) {
    return this.sitesService.update(id, updateSiteDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiOperation({ summary: 'Archive site' })
  @ApiResponse({ status: 200, description: 'Site archived successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sitesService.remove(id, user._id || user.id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiOperation({ summary: 'Restore archived site' })
  @ApiResponse({ status: 200, description: 'Site restored successfully' })
  restore(@Param('id') id: string) {
    return this.sitesService.restore(id);
  }
}

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
import { ConservationService } from './conservation.service.js';
import { CreateConservationDto } from './dto/create-conservation.dto.js';
import { UpdateConservationDto } from './dto/update-conservation.dto.js';
import { QueryConservationDto } from './dto/query-conservation.dto.js';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@ApiTags('conservation')
@Controller('conservation')
@UseGuards(ClerkAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ConservationController {
  constructor(@Inject(ConservationService) conservationService) {
    this.conservationService = conservationService;
  }

  @Post()
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Create new conservation project' })
  @ApiResponse({ status: 201, description: 'Conservation project created successfully' })
  create(@Body() createConservationDto, @CurrentUser() user) {
    return this.conservationService.create(createConservationDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all conservation projects' })
  @ApiResponse({ status: 200, description: 'Conservation projects retrieved successfully' })
  findAll(@Query() query, @CurrentUser() user) {
    return this.conservationService.findAll(query, user);
  }

  @Patch(':id')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Update conservation project' })
  @ApiResponse({ status: 200, description: 'Conservation project updated successfully' })
  update(@Param('id') id, @Body() updateConservationDto, @CurrentUser() user) {
    return this.conservationService.update(id, updateConservationDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiOperation({ summary: 'Archive conservation project' })
  @ApiResponse({ status: 200, description: 'Conservation project archived successfully' })
  remove(@Param('id') id, @CurrentUser() user) {
    return this.conservationService.remove(id, user);
  }

  @Patch(':id/restore')
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiOperation({ summary: 'Restore archived conservation project' })
  @ApiResponse({ status: 200, description: 'Conservation project restored successfully' })
  restore(@Param('id') id, @CurrentUser() user) {
    return this.conservationService.restore(id, user);
  }
}

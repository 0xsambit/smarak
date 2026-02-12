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
import { ConservationService } from './conservation.service';
import { CreateConservationDto } from './dto/create-conservation.dto';
import { UpdateConservationDto } from './dto/update-conservation.dto';
import { QueryConservationDto } from './dto/query-conservation.dto';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@schemas/user.schema';

@ApiTags('conservation')
@Controller('conservation')
@UseGuards(ClerkAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ConservationController {
  constructor(private readonly conservationService: ConservationService) {}

  @Post()
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Create new conservation project' })
  @ApiResponse({ status: 201, description: 'Conservation project created successfully' })
  create(@Body() createConservationDto: CreateConservationDto, @CurrentUser() user: any) {
    return this.conservationService.create(createConservationDto, user._id || user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all conservation projects' })
  @ApiResponse({ status: 200, description: 'Conservation projects retrieved successfully' })
  findAll(@Query() query: QueryConservationDto) {
    return this.conservationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conservation project by ID' })
  @ApiResponse({ status: 200, description: 'Conservation project found' })
  findOne(@Param('id') id: string) {
    return this.conservationService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Update conservation project' })
  @ApiResponse({ status: 200, description: 'Conservation project updated successfully' })
  update(@Param('id') id: string, @Body() updateConservationDto: UpdateConservationDto) {
    return this.conservationService.update(id, updateConservationDto);
  }

  @Delete(':id')
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiOperation({ summary: 'Delete conservation project' })
  @ApiResponse({ status: 200, description: 'Conservation project deleted successfully' })
  remove(@Param('id') id: string) {
    return this.conservationService.remove(id);
  }
}

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
import { ApprovalsService } from './approvals.service.js';
import { CreateApprovalDto } from './dto/create-approval.dto.js';
import { UpdateApprovalDto } from './dto/update-approval.dto.js';
import { ReviewApprovalDto } from './dto/review-approval.dto.js';
import { QueryApprovalsDto } from './dto/query-approvals.dto.js';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@ApiTags('approvals')
@Controller('approvals')
@UseGuards(ClerkAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(@Inject(ApprovalsService) approvalsService) {
    this.approvalsService = approvalsService;
  }

  @Post()
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Submit item for approval' })
  @ApiResponse({ status: 201, description: 'Approval created successfully' })
  create(@Body() createApprovalDto, @CurrentUser() user) {
    return this.approvalsService.create(createApprovalDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all approval requests' })
  @ApiResponse({ status: 200, description: 'Approvals retrieved successfully' })
  findAll(@Query() query, @CurrentUser() user) {
    return this.approvalsService.findAll(query, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit pending approval request' })
  @ApiResponse({ status: 200, description: 'Approval updated successfully' })
  update(
    @Param('id') id,
    @Body() updateApprovalDto,
    @CurrentUser() user,
  ) {
    return this.approvalsService.update(id, updateApprovalDto, user);
  }

  @Patch(':id/review')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Approve or reject approval request' })
  @ApiResponse({ status: 200, description: 'Approval reviewed successfully' })
  review(
    @Param('id') id,
    @Body() reviewApprovalDto,
    @CurrentUser() user,
  ) {
    return this.approvalsService.review(id, reviewApprovalDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiOperation({ summary: 'Archive approval request' })
  @ApiResponse({ status: 200, description: 'Approval archived successfully' })
  remove(@Param('id') id, @CurrentUser() user) {
    return this.approvalsService.remove(id, user._id || user.id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiOperation({ summary: 'Restore archived approval request' })
  @ApiResponse({ status: 200, description: 'Approval restored successfully' })
  restore(@Param('id') id) {
    return this.approvalsService.restore(id);
  }
}

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
import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { QueryApprovalsDto } from './dto/query-approvals.dto';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@schemas/user.schema';

@ApiTags('approvals')
@Controller('approvals')
@UseGuards(ClerkAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit item for approval' })
  @ApiResponse({ status: 201, description: 'Approval created successfully' })
  create(@Body() createApprovalDto: CreateApprovalDto, @CurrentUser() user: any) {
    return this.approvalsService.create(createApprovalDto, user._id || user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all approval requests' })
  @ApiResponse({ status: 200, description: 'Approvals retrieved successfully' })
  findAll(@Query() query: QueryApprovalsDto) {
    return this.approvalsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval by ID' })
  @ApiResponse({ status: 200, description: 'Approval found' })
  findOne(@Param('id') id: string) {
    return this.approvalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit pending approval request' })
  @ApiResponse({ status: 200, description: 'Approval updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateApprovalDto: UpdateApprovalDto,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.update(id, updateApprovalDto, {
      id: user._id || user.id,
      role: user.role,
    });
  }

  @Patch(':id/review')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiOperation({ summary: 'Approve or reject approval request' })
  @ApiResponse({ status: 200, description: 'Approval reviewed successfully' })
  review(
    @Param('id') id: string,
    @Body() reviewApprovalDto: ReviewApprovalDto,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.review(id, reviewApprovalDto, user._id || user.id);
  }

  @Delete(':id')
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiOperation({ summary: 'Archive approval request' })
  @ApiResponse({ status: 200, description: 'Approval archived successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.approvalsService.remove(id, user._id || user.id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiOperation({ summary: 'Restore archived approval request' })
  @ApiResponse({ status: 200, description: 'Approval restored successfully' })
  restore(@Param('id') id: string) {
    return this.approvalsService.restore(id);
  }
}

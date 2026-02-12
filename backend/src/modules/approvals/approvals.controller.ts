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
  @ApiOperation({ summary: 'Delete approval request' })
  @ApiResponse({ status: 200, description: 'Approval deleted successfully' })
  remove(@Param('id') id: string) {
    return this.approvalsService.remove(id);
  }
}

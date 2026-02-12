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
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@schemas/user.schema';

@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Clerk webhook for user sync' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Body() body: any,
  ) {
    const webhookSecret = this.configService.get<string>('clerk.webhookSecret');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const wh = new Webhook(webhookSecret);

    let event: any;

    try {
      event = wh.verify(JSON.stringify(body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      this.logger.error('Webhook verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventType = event.type;
    const userData = event.data;

    this.logger.log(`Processing webhook event: ${eventType}`);

    switch (eventType) {
      case 'user.created':
        const newUser = {
          clerkId: userData.id,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Unknown',
          email: userData.email_addresses?.[0]?.email_address || 'no-email@example.com',
          role: userData.public_metadata?.role || UserRole.SITE_OFFICER,
        };
        await this.usersService.create(newUser);
        this.logger.log(`User created: ${newUser.clerkId}`);
        break;

      case 'user.updated':
        const updateData = {
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          email: userData.email_addresses?.[0]?.email_address,
          role: userData.public_metadata?.role,
        };
        await this.usersService.updateByClerkId(userData.id, updateData);
        this.logger.log(`User updated: ${userData.id}`);
        break;

      case 'user.deleted':
        await this.usersService.removeByClerkId(userData.id);
        this.logger.log(`User deleted: ${userData.id}`);
        break;

      default:
        this.logger.warn(`Unhandled webhook event type: ${eventType}`);
    }

    return { success: true };
  }

  @Post()
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.STATE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.NATIONAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

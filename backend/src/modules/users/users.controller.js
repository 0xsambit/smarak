import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Post,
  UseGuards,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service.js';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(UsersService) usersService,
    @Inject(ConfigService) configService,
  ) {
    this.usersService = usersService;
    this.configService = configService;
    this.logger = new Logger(UsersController.name);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Clerk webhook for user sync' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Headers('svix-id') svixId,
    @Headers('svix-timestamp') svixTimestamp,
    @Headers('svix-signature') svixSignature,
    @Body() body,
  ) {
    const webhookSecret = this.configService.get('clerk.webhookSecret');
    if (!webhookSecret) throw new BadRequestException('Webhook secret not configured');

    let event;
    try {
      event = new Webhook(webhookSecret).verify(JSON.stringify(body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      this.logger.error('Webhook verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    const userData = event.data;
    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'user.created': {
        const emailRaw = userData.email_addresses?.[0]?.email_address;
        const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : null;
        if (!email) {
          this.logger.warn(`Skipping user.created for ${userData.id}: missing email`);
          break;
        }
        await this.usersService.create({
          clerkId: userData.id,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Unknown',
          email,
          role: this.normalizeWebhookRole(userData.public_metadata?.role) || UserRole.SITE_OFFICER,
        });
        this.logger.log(`User created: ${userData.id}`);
        break;
      }
      case 'user.updated': {
        const emailRaw = userData.email_addresses?.[0]?.email_address;
        const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : undefined;
        const role = this.normalizeWebhookRole(userData.public_metadata?.role);
        const updateData = {
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          ...(email ? { email } : {}),
          ...(role ? { role } : {}),
        };
        await this.usersService.updateByClerkId(userData.id, updateData);
        this.logger.log(`User updated: ${userData.id}`);
        break;
      }
      case 'user.deleted':
        await this.usersService.removeByClerkId(userData.id);
        this.logger.log(`User deleted: ${userData.id}`);
        break;
      default:
        this.logger.warn(`Unhandled webhook event type: ${event.type}`);
    }

    return { success: true };
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  getProfile(@CurrentUser() user) {
    return user;
  }

  normalizeWebhookRole(role) {
    if (typeof role !== 'string') return null;
    return Object.values(UserRole).includes(role) ? role : null;
  }
}

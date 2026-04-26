import { CanActivate, Injectable, Logger, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createClerkClient, verifyToken } from '@clerk/clerk-sdk-node';
import { User, UserRole } from '../../schemas/user.schema.js';

@Injectable()
export class ClerkAuthGuard {
  constructor(
    @InjectModel(User.name) userModel,
    @Inject(ConfigService) configService,
  ) {
    this.userModel = userModel;
    this.configService = configService;
    this.logger = new Logger(ClerkAuthGuard.name);
  }

  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const clerkSecretKey = this.configService.get('clerk.secretKey');

    if (!clerkSecretKey) {
      throw new UnauthorizedException('Clerk secret key is not configured');
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: clerkSecretKey,
      });

      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
      const clerkUser = await clerkClient.users.getUser(payload.sub);
      const user = await this.provisionUser(clerkUser);

      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);

      this.logger.warn(`Token verification failed: ${errorMessage}`);

      throw new UnauthorizedException('Token verification failed');
    }
  }

  async provisionUser(clerkUser) {
    const clerkId = clerkUser.id;
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      throw new UnauthorizedException('Authenticated Clerk user has no email address');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingByClerkId = await this.userModel.findOne({ clerkId }).lean().exec();
    const existingByEmail = await this.findUserByEmail(normalizedEmail);

    if (
      existingByClerkId &&
      existingByEmail &&
      existingByClerkId._id?.toString() !== existingByEmail._id?.toString()
    ) {
      this.logger.error(
        `User identity conflict for clerkId ${clerkId}: clerkId maps to ${existingByClerkId._id?.toString()}, email maps to ${existingByEmail._id?.toString()}`,
      );
      throw new UnauthorizedException('User identity conflict. Please contact support.');
    }

    const existingUser = existingByClerkId || existingByEmail;

    if (!existingByClerkId && existingByEmail && existingByEmail.clerkId !== clerkId) {
      this.logger.log(
        `Re-linking existing user ${existingByEmail._id?.toString()} from clerkId ${existingByEmail.clerkId} to ${clerkId} based on unique email ${normalizedEmail}`,
      );
    }

    const name =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
      existingUser?.name ||
      normalizedEmail.split('@')[0];

    const updateQuery = existingUser ? { _id: existingUser._id } : { clerkId };
    const updatePayload = {
      clerkId,
      email: normalizedEmail,
      name,
      role: this.resolveRole({
        clerkId,
        email: normalizedEmail,
        metadataRole: clerkUser.publicMetadata?.role,
        existingRole: existingUser?.role,
      }),
      isActive: true,
    };

    try {
      const user = await this.userModel
        .findOneAndUpdate(updateQuery, updatePayload, {
          new: true,
          upsert: !existingUser,
          setDefaultsOnInsert: true,
        })
        .lean()
        .exec();

      if (!user) {
        throw new UnauthorizedException('Unable to provision user');
      }

      return user;
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) {
        throw error;
      }

      const fallbackByEmail = await this.findUserByEmail(normalizedEmail);

      if (!fallbackByEmail) {
        throw error;
      }

      if (
        existingByClerkId &&
        existingByClerkId._id?.toString() !== fallbackByEmail._id?.toString()
      ) {
        throw new UnauthorizedException('User identity conflict. Please contact support.');
      }

      const recoveredUser = await this.userModel
        .findOneAndUpdate(
          { _id: fallbackByEmail._id },
          {
            ...updatePayload,
            role: this.resolveRole({
              clerkId,
              email: normalizedEmail,
              metadataRole: clerkUser.publicMetadata?.role,
              existingRole: fallbackByEmail.role,
            }),
          },
          {
            new: true,
            upsert: false,
          },
        )
        .lean()
        .exec();

      if (!recoveredUser) {
        throw new UnauthorizedException('Unable to provision user');
      }

      this.logger.warn(
        `Recovered duplicate email conflict by linking clerkId ${clerkId} to existing user ${fallbackByEmail._id?.toString()}`,
      );

      return recoveredUser;
    }
  }

  resolveRole(params) {
    const bootstrapAdminClerkId = this.configService.get('clerk.bootstrapAdminClerkId');
    const bootstrapAdminEmail = this.configService.get('clerk.bootstrapAdminEmail');

    if (
      (bootstrapAdminClerkId && params.clerkId === bootstrapAdminClerkId) ||
      (bootstrapAdminEmail && params.email === bootstrapAdminEmail)
    ) {
      return UserRole.NATIONAL_ADMIN;
    }

    return (
      this.normalizeRole(params.metadataRole) ||
      params.existingRole ||
      UserRole.SITE_OFFICER
    );
  }

  normalizeRole(role) {
    if (typeof role !== 'string') {
      return null;
    }

    return Object.values(UserRole).includes(role) ? role : null;
  }

  async findUserByEmail(email) {
    return this.userModel
      .findOne({
        email: {
          $regex: new RegExp(`^${this.escapeRegex(email)}$`, 'i'),
        },
      })
      .lean()
      .exec();
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  isDuplicateKeyError(error) {
    if (!error || typeof error !== 'object') {
      return false;
    }
    return error.code === 11000;
  }
}

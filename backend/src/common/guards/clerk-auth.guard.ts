import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createClerkClient, verifyToken } from '@clerk/clerk-sdk-node';
import { User, UserRole } from '@schemas/user.schema';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const clerkSecretKey = this.configService.get<string>('clerk.secretKey');

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

      throw new UnauthorizedException('Token verification failed');
    }
  }

  private async provisionUser(clerkUser: any) {
    const clerkId = clerkUser.id as string;
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      throw new UnauthorizedException('Authenticated Clerk user has no email address');
    }

    const existingUser = await this.userModel.findOne({ clerkId }).lean().exec();
    const normalizedEmail = email.toLowerCase();
    const name =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
      existingUser?.name ||
      normalizedEmail.split('@')[0];

    const user = await this.userModel
      .findOneAndUpdate(
        { clerkId },
        {
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
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();

    if (!user) {
      throw new UnauthorizedException('Unable to provision user');
    }

    return user;
  }

  private resolveRole(params: {
    clerkId: string;
    email: string;
    metadataRole?: unknown;
    existingRole?: UserRole;
  }): UserRole {
    const bootstrapAdminClerkId = this.configService.get<string>('clerk.bootstrapAdminClerkId');
    const bootstrapAdminEmail = this.configService.get<string>('clerk.bootstrapAdminEmail');

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

  private normalizeRole(role: unknown): UserRole | null {
    if (typeof role !== 'string') {
      return null;
    }

    return (Object.values(UserRole) as string[]).includes(role)
      ? (role as UserRole)
      : null;
  }
}

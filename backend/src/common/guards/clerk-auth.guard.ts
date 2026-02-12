import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { User } from '@schemas/user.schema';

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

    try {
      // Verify Clerk JWT
      const clerkSecretKey = this.configService.get<string>('clerk.secretKey');
      const payload = await verifyToken(token, {
        secretKey: clerkSecretKey,
      });

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Find user in database by Clerk ID
      const user = await this.userModel.findOne({ clerkId: payload.sub }).lean().exec();

      if (!user) {
        throw new UnauthorizedException('User not found in system');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Attach user to request
      request.user = user;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }
}

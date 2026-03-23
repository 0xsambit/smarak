import { registerAs } from '@nestjs/config';

export default registerAs('clerk', () => ({
  secretKey: process.env.CLERK_SECRET_KEY,
  webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  bootstrapAdminClerkId: process.env.BOOTSTRAP_ADMIN_CLERK_ID,
  bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase(),
}));

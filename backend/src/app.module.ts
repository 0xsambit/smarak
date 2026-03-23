import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Config imports
import databaseConfig from '@config/database.config';
import clerkConfig from '@config/clerk.config';
import appConfig from '@config/app.config';

// Module imports
import { UsersModule } from './modules/users/users.module';
import { SitesModule } from './modules/sites/sites.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { ConservationModule } from './modules/conservation/conservation.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

const requireEnv = (env: NodeJS.ProcessEnv, key: string) => {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const validateNumber = (value: string | undefined, fallback: number, key: string) => {
  const raw = value ?? String(fallback);
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer. Received: ${raw}`);
  }
  return parsed;
};

const validateEnvironment = (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv => {
  requireEnv(env, 'MONGODB_URI');
  requireEnv(env, 'CLERK_SECRET_KEY');

  const nodeEnv = env.NODE_ENV ?? 'development';
  if (nodeEnv === 'production') {
    requireEnv(env, 'CLERK_WEBHOOK_SECRET');
  }

  validateNumber(env.PORT, 8080, 'PORT');
  validateNumber(env.RATE_LIMIT_TTL, 900000, 'RATE_LIMIT_TTL');
  validateNumber(env.RATE_LIMIT_MAX, 100, 'RATE_LIMIT_MAX');

  const corsOrigin = (env.CORS_ORIGIN ?? 'http://localhost:5173').trim();
  if (!corsOrigin) {
    throw new Error('CORS_ORIGIN must not be empty');
  }

  const origins = corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0) {
    throw new Error('CORS_ORIGIN must contain at least one origin');
  }

  for (const origin of origins) {
    try {
      new URL(origin);
    } catch {
      throw new Error(`CORS_ORIGIN contains an invalid URL: ${origin}`);
    }
  }

  return env;
};

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, clerkConfig, appConfig],
      validate: validateEnvironment,
    }),

    // Database connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        ...configService.get('database.options'),
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('app.rateLimitTtl') || 900000,
            limit: configService.get<number>('app.rateLimitMax') || 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    UsersModule,
    SitesModule,
    IncidentsModule,
    ConservationModule,
    ApprovalsModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

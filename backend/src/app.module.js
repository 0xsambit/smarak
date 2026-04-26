import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import databaseConfig from './config/database.config.js';
import clerkConfig from './config/clerk.config.js';
import appConfig from './config/app.config.js';

import { UsersModule } from './modules/users/users.module.js';
import { SitesModule } from './modules/sites/sites.module.js';
import { IncidentsModule } from './modules/incidents/incidents.module.js';
import { ConservationModule } from './modules/conservation/conservation.module.js';
import { ApprovalsModule } from './modules/approvals/approvals.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';

const requireEnv = (env, key) => {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const validateNumber = (value, fallback, key) => {
  const raw = value ?? String(fallback);
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer. Received: ${raw}`);
  }
  return parsed;
};

const validateEnvironment = (env) => {
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
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, clerkConfig, appConfig],
      validate: validateEnvironment,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService) => ({
        uri: configService.get('database.uri'),
        ...configService.get('database.options'),
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService) => ({
        throttlers: [
          {
            ttl: configService.get('app.rateLimitTtl') || 900000,
            limit: configService.get('app.rateLimitMax') || 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),

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

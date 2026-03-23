import { registerAs } from '@nestjs/config';

const corsOriginValue = process.env.CORS_ORIGIN || 'http://localhost:5173';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  corsOrigin: corsOriginValue,
  corsOrigins: corsOriginValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
}));

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.getHttpAdapter().getInstance().set('etag', false);

  app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  const configService = app.get(ConfigService);

  app.use(helmet());

  const corsOrigins = configService.get<string[]>('app.corsOrigins') || ['http://localhost:5173'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Heritage Site Management API')
    .setDescription(
      'Production-grade API for managing heritage sites, incidents, conservation projects, and approvals',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Clerk JWT token',
      },
      'bearer',
    )
    .addTag('users', 'User management and Clerk webhook integration')
    .addTag('sites', 'Heritage site management with geospatial queries')
    .addTag('incidents', 'Incident tracking and reporting')
    .addTag('conservation', 'Conservation project management')
    .addTag('approvals', 'Approval workflow system')
    .addTag('dashboard', 'Dashboard analytics and KPIs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get<number>('app.port') || 8080;
  await app.listen(port);

  console.log(`\n🚀 Heritage Site Management Backend`);
  console.log(`📝 API running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  console.log(`🔒 CORS enabled for: ${corsOrigins.join(', ')}`);
  console.log(`🌍 Environment: ${configService.get<string>('app.nodeEnv')}\n`);
}

bootstrap();

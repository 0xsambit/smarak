import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOrigin = configService.get<string>('app.corsOrigin');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global validation pipe with strict settings
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

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation setup
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
  console.log(`🔒 CORS enabled for: ${corsOrigin}`);
  console.log(`🌍 Environment: ${configService.get<string>('app.nodeEnv')}\n`);
}

bootstrap();

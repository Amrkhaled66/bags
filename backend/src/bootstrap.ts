import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { ServerResponse } from 'http';
import { resolve } from 'path';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { parseCorsOrigins } from './config/environment';

export function configureApp(
  app: NestExpressApplication,
  config: ConfigService,
) {
  const corsOrigins = parseCorsOrigins(config.get<string>('CORS_ORIGIN'));
  const imageDirectory = resolve(
    process.cwd(),
    config.get<string>('IMAGE_DIRECTORY') ?? 'uploads/images',
  );

  app.use((request: Request, response: Response, next: NextFunction) => {
    const suppliedId = request.header('x-request-id');
    const requestId =
      suppliedId && /^[A-Za-z0-9._-]{1,100}$/.test(suppliedId)
        ? suppliedId
        : randomUUID();
    response.setHeader('X-Request-Id', requestId);
    next();
  });
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Idempotency-Key',
      'X-Cart-Token',
      'X-Order-Token',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Request-Id'],
  });
  app.useStaticAssets(imageDirectory, {
    prefix: '/uploads/images/',
    index: false,
    dotfiles: 'deny',
    setHeaders: (response: ServerResponse) => {
      response.setHeader('X-Content-Type-Options', 'nosniff');
    },
  });
  app.useGlobalPipes(new StandardSchemaValidationPipe({ transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
}

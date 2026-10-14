import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { static as serveStatic } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 5) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5.');
  }
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',').map((origin) =>
      origin.trim(),
    ) ?? ['http://localhost:3001', 'http://127.0.0.1:3001'],
  });
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    if (process.env.NODE_ENV === 'production') {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const uploadDirectory = resolve(
    process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads'),
  );
  await mkdir(uploadDirectory, { recursive: true });
  app.use(
    '/uploads',
    serveStatic(uploadDirectory, {
      dotfiles: 'deny',
      index: false,
      fallthrough: false,
      maxAge: '1y',
      immutable: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

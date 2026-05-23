import { initTracing } from './common/tracing';
initTracing();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validationPipe } from './common/pipes/validation.pipe';
import { register } from './common/metrics';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { json, raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('app.frontendUrl'),
    credentials: true,
  });

  app.use('/api/billing/webhook', raw({ type: 'application/json' }));
  app.use(json());

  app.useGlobalPipes(validationPipe);

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/metrics', async (_req: unknown, res: { setHeader: (k: string, v: string) => void; send: (b: string) => void }) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  const port = config.get<number>('app.port') ?? 3001;
  await app.listen(port);
  console.log(`Forge API running on http://localhost:${port}`);
}

bootstrap();

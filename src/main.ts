import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.enableCors({
    origin: app.get(ConfigService).get<string>('CLIENT_URL'),
    credentials: true,
  });
  app.enableShutdownHooks();
  await app.listen(app.get(ConfigService).get<number>('PORT', 3001));
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();

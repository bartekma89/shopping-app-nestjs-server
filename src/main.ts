import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.enableCors({
    origin: app.get(ConfigService).get<string>('CLIENT_URL'),
    credentials: true,
  });
  await app.listen(app.get(ConfigService).get<number>('PORT', 3001));
}
bootstrap();

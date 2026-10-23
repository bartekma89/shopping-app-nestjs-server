import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ServeStaticModule } from '@nestjs/serve-static';
import { BullModule } from '@nestjs/bullmq';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { PRODUCT_IMAGES_DIR } from './constants';
import { CheckoutModule } from './checkout/checkout.module';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                  },
                },
          },
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env'
          : `.env.${process.env.NODE_ENV ?? 'development'}`,
    }),
    ServeStaticModule.forRoot({
      rootPath: PRODUCT_IMAGES_DIR,
      serveRoot: '/products',
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          port: Number(configService.getOrThrow<string>('REDIS_PORT')),
          host: configService.getOrThrow<string>('REDIS_HOST'),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CheckoutModule,
  ],
  controllers: [],
})
export class AppModule {}

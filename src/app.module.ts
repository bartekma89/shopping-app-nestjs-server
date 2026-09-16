import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { UsersModule } from './users/users.module';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';

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
    UsersModule,
  ],
  controllers: [],
})
export class AppModule {}

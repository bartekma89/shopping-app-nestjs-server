import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { UsersModule } from '../users/users.module';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { ProductsModule } from '../products/products.module';

@Module({
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    {
      provide: Stripe,
      useFactory: (configService: ConfigService) =>
        new Stripe(configService.getOrThrow<string>('STRIPE_SECRET_KEY')),
      inject: [ConfigService],
    },
  ],
  imports: [UsersModule, ProductsModule],
})
export class CheckoutModule {}

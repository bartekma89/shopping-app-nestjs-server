import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { UsersModule } from '../users/users.module';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { ProductsModule } from '../products/products.module';
import { BullModule } from '@nestjs/bullmq';
import { STRIPE_WEBHOOK_QUEUE } from '../constants';
import { StripeWebhookProcessor } from './stripe-webhook.processor';

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
    StripeWebhookProcessor,
  ],
  imports: [
    UsersModule,
    ProductsModule,
    BullModule.registerQueue({ name: STRIPE_WEBHOOK_QUEUE }),
  ],
})
export class CheckoutModule {}

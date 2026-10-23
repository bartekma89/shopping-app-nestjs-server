import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ProductsService } from '../products/products.service';
import { ConfigService } from '@nestjs/config';
import { CheckoutSessionResponse } from './types';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { STRIPE_WEBHOOK_QUEUE } from '../constants';

const HANDLED_EVENTS = new Set<Stripe.Event.Type>([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectQueue(STRIPE_WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
    private readonly stripe: Stripe,
    private readonly productsService: ProductsService,
    private readonly configService: ConfigService,
  ) {}

  async createSession(productId: number): Promise<CheckoutSessionResponse> {
    const product = await this.productsService.getProduct(productId);

    if (product.sold) {
      throw new ConflictException(`Product ${productId} is already sold`);
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'pln',
            unit_amount: product.priceCents,
            product_data: {
              name: product.name,
              description: product.description,
            },
          },
        },
      ],
      metadata: { productId: String(product.id) },
      success_url: this.configService.getOrThrow<string>('STRIPE_SUCCESS_URL'),
      cancel_url: this.configService.getOrThrow<string>('STRIPE_CANCEL_URL'),
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        'Stripe did not return a checkout URL',
      );
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    const webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.warn(`Invalid Stripe signature: ${String(error)}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    if (!HANDLED_EVENTS.has(event.type)) {
      return;
    }

    await this.webhookQueue.add(event.type, event, {
      jobId: event.id,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: { age: 24 * 3600 },
      removeOnFail: { age: 7 * 24 * 3600 },
    });
  }
}

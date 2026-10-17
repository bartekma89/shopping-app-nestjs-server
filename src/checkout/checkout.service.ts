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

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
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

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;

        if (session.payment_status !== 'paid') {
          return;
        }

        const productId = Number(session.metadata?.productId);

        if (!Number.isInteger(productId)) {
          this.logger.error(`Invalid productId ${productId}`);
          return;
        }
        await this.productsService.markAsSold(productId);

        return;
      }
      default:
        return;
    }
  }
}

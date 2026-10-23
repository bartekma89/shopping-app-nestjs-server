import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { STRIPE_WEBHOOK_QUEUE } from '../constants';
import { Job, UnrecoverableError } from 'bullmq';
import Stripe from 'stripe';
import { ProductsService } from '../products/products.service';
import { Logger } from '@nestjs/common';

@Processor(STRIPE_WEBHOOK_QUEUE)
export class StripeWebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(StripeWebhookProcessor.name);

  constructor(private readonly productsService: ProductsService) {
    super();
  }

  async process(job: Job<Stripe.Event>): Promise<void> {
    switch (job.data.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = job.data.data.object;

        if (session.payment_status !== 'paid') {
          return;
        }

        const productId = Number(session.metadata?.productId);

        if (!Number.isInteger(productId)) {
          throw new UnrecoverableError(`Invalid productId ${productId}`);
        }
        await this.productsService.markAsSold(productId);

        return;
      }
      default:
        return;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    const willRetry = error instanceof UnrecoverableError;

    if (!willRetry && (job?.attemptsMade ?? 1) < (job?.opts.attempts ?? 1)) {
      this.logger.warn(
        `Job ${job?.id} failed (${job?.attemptsMade}/${job?.opts.attempts}), retrying: ${error.message}`,
      );
    } else {
      this.logger.error(`Job ${job?.id} failed permanently: ${error.message}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed (attempt ${job.attemptsMade})`);
  }
}

import type { Request } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  type RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  type CreateSessionDto,
  CreateSessionSchema,
} from '../dtos/checkout.dto';
import { CheckoutSessionResponse } from './types';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('session')
  @UseGuards(JwtAuthGuard)
  async createSession(
    @Body(new ZodValidationPipe(CreateSessionSchema)) body: CreateSessionDto,
  ): Promise<CheckoutSessionResponse> {
    return this.checkoutService.createSession(body.productId);
  }

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!req.rawBody || !signature) {
      throw new BadRequestException('Missing raw body or Stripe signature');
    }

    return this.checkoutService.handleWebhook(req.rawBody, signature);
  }
}

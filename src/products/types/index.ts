import { Product } from '../../generated/prisma/client';

export type ProductEvent =
  | {
      type: 'product.sold';
      productId: number;
      sellerId: number;
    }
  | {
      type: 'product.created';
      product: Product;
    }
  | {
      type: 'product.purchased';
      recipientId: number;
      productId: number;
      name: string;
      priceCents: number;
    };

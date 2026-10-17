import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().trim().min(1, {
    error: 'Name required',
  }),
  description: z.string().trim().min(1, {
    error: 'Description required',
  }),
  priceCents: z.int({ error: 'Price must be an integer (cents)' }).positive({
    error: 'Price must be a positive number',
  }),
});

export type ProductDto = z.infer<typeof ProductSchema>;

export const GetProductsQuerySchema = z.object({
  status: z.enum(['available', 'sold']).optional(),
});

export type GetProductsQueryDto = z.infer<typeof GetProductsQuerySchema>;

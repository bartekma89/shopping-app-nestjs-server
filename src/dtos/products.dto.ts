import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string({
    error: 'Name required',
  }),
  description: z.string({
    error: 'Description required',
  }),
  price: z.number({
    error: 'Price required',
  }),
});

export type ProductDto = z.infer<typeof ProductSchema>;

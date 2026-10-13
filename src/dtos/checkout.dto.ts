import { z } from 'zod';

export const CreateSessionSchema = z.object({
  productId: z
    .int({
      error: 'Product Id must be a number',
    })
    .positive({
      error: 'ProductId must be a positive value',
    }),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;

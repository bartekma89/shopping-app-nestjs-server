import { z } from 'zod';

export const createUsers = z.object({
  email: z.email(),
  password: z.string(),
});

export type TCreateUsersDto = z.infer<typeof createUsers>;

import { z } from 'zod';

export const CredentialSchema = z.object({
  email: z.email({
    error: 'Enter a valid email',
  }),
  password: z.string({ error: 'Password required' }).min(1, {
    error: 'Password required',
  }),
});

export type CredentialsDto = z.infer<typeof CredentialSchema>;

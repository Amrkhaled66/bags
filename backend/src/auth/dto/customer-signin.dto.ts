import { z } from 'zod';

export const customerSigninSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});

export type CustomerSigninDto = z.infer<typeof customerSigninSchema>;

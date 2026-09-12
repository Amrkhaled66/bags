import { z } from 'zod';

export const adminSigninSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});

export type AdminSigninDto = z.infer<typeof adminSigninSchema>;

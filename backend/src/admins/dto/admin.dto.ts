import { z } from 'zod';

export const adminIdSchema = z.uuid();

export const createAdminSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.string().trim().min(1).max(50).default('admin'),
});

export const updateAdminSchema = createAdminSchema
  .omit({ password: true })
  .extend({
    password: z.string().min(8).max(128).optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type CreateAdminDto = z.infer<typeof createAdminSchema>;
export type UpdateAdminDto = z.infer<typeof updateAdminSchema>;

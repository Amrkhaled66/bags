import { z } from 'zod';
import { listQuerySchema } from '../../common/list-query.schema';

export const listCustomersQuerySchema = listQuerySchema.safeExtend({
  sortBy: z.enum(['createdAt', 'name', 'email']).default('createdAt'),
  governorate: z.string().trim().min(1).max(100).optional(),
});
export type ListCustomersQueryDto = z.infer<typeof listCustomersQuerySchema>;

export const customerIdSchema = z.uuid();

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().trim().min(1).max(30).nullable().optional(),
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(128),
  governorate: z.string().trim().min(1).max(100).nullable().optional(),
  cityArea: z.string().trim().min(1).max(150).nullable().optional(),
  streetAddress: z.string().trim().min(1).nullable().optional(),
});

export const updateCustomerProfileSchema = createCustomerSchema
  .omit({ email: true, password: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerProfileDto = z.infer<
  typeof updateCustomerProfileSchema
>;

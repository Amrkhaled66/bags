import { z } from 'zod';

export const shippingRateIdSchema = z.uuid();
export const governorateParamSchema = z.string().trim().min(1).max(100);

const moneySchema = z.coerce
  .number()
  .nonnegative()
  .transform((value) => value.toFixed(2));
const booleanQuerySchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const listShippingRatesQuerySchema = z.object({
  isActive: booleanQuerySchema.optional(),
});

export const createShippingRateSchema = z.object({
  governorate: z.string().trim().min(1).max(100),
  shippingPrice: moneySchema,
  freeShippingThreshold: moneySchema.nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateShippingRateSchema = createShippingRateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type ListShippingRatesQueryDto = z.infer<
  typeof listShippingRatesQuerySchema
>;
export type CreateShippingRateDto = z.infer<typeof createShippingRateSchema>;
export type UpdateShippingRateDto = z.infer<typeof updateShippingRateSchema>;

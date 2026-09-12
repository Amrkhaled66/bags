import { z } from 'zod';
import { listQuerySchema } from '../../common/list-query.schema';

export const couponIdSchema = z.uuid();
export const couponCodeSchema = z.string().trim().min(1).max(100).toUpperCase();

const moneySchema = z.coerce
  .number()
  .nonnegative()
  .transform((value) => value.toFixed(2));
const percentageSchema = z.coerce
  .number()
  .positive()
  .max(100)
  .transform((value) => value.toFixed(2));
const booleanQuerySchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const listCouponsQuerySchema = listQuerySchema.safeExtend({
  sortBy: z.enum(['createdAt', 'code', 'expiresAt']).default('createdAt'),
  isActive: booleanQuerySchema.optional(),
  code: z.string().trim().min(1).max(100).toUpperCase().optional(),
});

export const createCouponSchema = z.object({
  code: couponCodeSchema,
  percentage: percentageSchema,
  minimumOrder: moneySchema.default('0.00'),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type ListCouponsQueryDto = z.infer<typeof listCouponsQuerySchema>;
export type CreateCouponDto = z.infer<typeof createCouponSchema>;
export type UpdateCouponDto = z.infer<typeof updateCouponSchema>;

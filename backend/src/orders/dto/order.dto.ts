import { z } from 'zod';
import { listQuerySchema } from '../../common/list-query.schema';
import { couponCodeSchema } from '../../coupons/dto/coupon.dto';

export const orderIdSchema = z.uuid();
export const orderNumberSchema = z.string().trim().min(1).max(50);
export const idempotencyKeySchema = z.uuid();

const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]);

const addressSchema = z.object({
  governorate: z.string().trim().min(1).max(100),
  cityArea: z.string().trim().min(1).max(150),
  streetAddress: z.string().trim().min(1).max(1000),
});

export const orderQuoteSchema = z.object({
  governorate: addressSchema.shape.governorate,
  couponCode: couponCodeSchema.optional(),
});

export const checkoutSchema = addressSchema.extend({
  customerName: z.string().trim().min(2).max(150),
  customerPhone: z.string().trim().min(6).max(30),
  customerEmail: z.email().optional().nullable(),
  couponCode: couponCodeSchema.optional(),
});

export const listAdminOrdersQuerySchema = listQuerySchema.safeExtend({
  sortBy: z.enum(['createdAt', 'total', 'orderNumber']).default('createdAt'),
  customerId: z.uuid().optional(),
  governorate: addressSchema.shape.governorate.optional(),
  status: orderStatusSchema.optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

export type OrderQuoteDto = z.infer<typeof orderQuoteSchema>;
export type CheckoutDto = z.infer<typeof checkoutSchema>;
export type ListAdminOrdersQueryDto = z.infer<
  typeof listAdminOrdersQuerySchema
>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

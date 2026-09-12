import { z } from 'zod';

export const paymentStatusSchema = z.enum([
  'pending',
  'paid',
  'failed',
  'partially_refunded',
  'refunded',
]);

export const updatePaymentStatusSchema = z.object({
  status: paymentStatusSchema,
});

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type UpdatePaymentStatusDto = z.infer<typeof updatePaymentStatusSchema>;

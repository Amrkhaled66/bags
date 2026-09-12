import { z } from 'zod';
import { listQuerySchema } from '../../common/list-query.schema';
import { orderNumberSchema } from '../../orders/dto/order.dto';

export const returnIdSchema = z.uuid();

export const returnStatusSchema = z.enum([
  'requested',
  'approved',
  'rejected',
  'received',
  'completed',
]);

const returnItemSchema = z.object({
  orderItemId: z.uuid(),
  quantity: z.coerce.number().int().positive(),
});

export const createReturnSchema = z
  .object({
    orderNumber: orderNumberSchema,
    reason: z.string().trim().min(5).max(2000),
    items: z.array(returnItemSchema).min(1).max(100),
  })
  .superRefine((value, context) => {
    const orderItemIds = value.items.map((item) => item.orderItemId);

    if (new Set(orderItemIds).size !== orderItemIds.length) {
      context.addIssue({
        code: 'custom',
        message: 'Each order item can only appear once',
        path: ['items'],
      });
    }
  });

export const listAdminReturnsQuerySchema = listQuerySchema.safeExtend({
  sortBy: z.enum(['createdAt', 'status']).default('createdAt'),
  orderId: z.uuid().optional(),
  customerId: z.uuid().optional(),
  status: returnStatusSchema.optional(),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'received']),
});

export const completeRefundSchema = z.object({
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type CreateReturnDto = z.infer<typeof createReturnSchema>;
export type ListAdminReturnsQueryDto = z.infer<
  typeof listAdminReturnsQuerySchema
>;
export type UpdateReturnStatusDto = z.infer<typeof updateReturnStatusSchema>;
export type CompleteRefundDto = z.infer<typeof completeRefundSchema>;

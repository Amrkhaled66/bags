import { z } from 'zod';

export const cartItemIdSchema = z.uuid();
export const cartTokenSchema = z.string().trim().min(32).max(255);

export const cartSessionSchema = z.object({
  cartToken: cartTokenSchema.optional(),
});

export const addCartItemSchema = z.object({
  variantId: z.uuid(),
  quantity: z.coerce.number().int().positive(),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export type CartSessionDto = z.infer<typeof cartSessionSchema>;
export type AddCartItemDto = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;

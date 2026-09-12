import { z } from 'zod';

export const updateShipmentSchema = z.object({
  trackingNumber: z.string().trim().min(3).max(150),
});

export type UpdateShipmentDto = z.infer<typeof updateShipmentSchema>;

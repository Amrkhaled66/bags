import { z } from "zod";

export const returnStatusSchema = z.enum([
  "requested",
  "approved",
  "rejected",
  "received",
  "completed",
]);

export const updateReturnStatusSchema = z.enum([
  "approved",
  "rejected",
  "received",
]);

export const refundFormSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});

export type RefundFormValues = z.infer<typeof refundFormSchema>;

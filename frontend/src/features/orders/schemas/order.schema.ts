import { z } from "zod";

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "partially_refunded",
  "refunded",
]);

export const shipmentFormSchema = z.object({
  trackingNumber: z.string().trim().min(3, "Tracking number is too short.").max(150),
});

export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

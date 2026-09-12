import { z } from "zod";

const moneySchema = z
  .string()
  .trim()
  .min(1, "Amount is required.")
  .regex(/^\d+(\.\d{1,2})?$/, "Use a valid non-negative amount.");

const optionalMoneySchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Use a valid non-negative amount.")
  .optional()
  .or(z.literal(""));

export const shippingRateFormSchema = z.object({
  governorate: z.string().trim().min(1, "Governorate is required.").max(100),
  shippingPrice: moneySchema,
  freeShippingThreshold: optionalMoneySchema,
  isActive: z.boolean(),
});

export type ShippingRateFormValues = z.infer<typeof shippingRateFormSchema>;

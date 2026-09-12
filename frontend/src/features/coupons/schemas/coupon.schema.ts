import { z } from "zod";

const moneySchema = z
  .string()
  .trim()
  .min(1, "Amount is required.")
  .regex(/^\d+(\.\d{1,2})?$/, "Use a valid non-negative amount.");

const percentageSchema = z
  .string()
  .trim()
  .min(1, "Percentage is required.")
  .regex(/^\d+(\.\d{1,2})?$/, "Use a valid percentage.")
  .refine((value) => Number(value) > 0 && Number(value) <= 100, {
    message: "Percentage must be between 0.01 and 100.",
  });

export const couponFormSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required.").max(100),
  percentage: percentageSchema,
  minimumOrder: moneySchema,
  usageLimit: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, "Use a positive whole number.")
    .optional()
    .or(z.literal("")),
  expiresAt: z.string().optional(),
  isActive: z.boolean(),
});

export type CouponFormValues = z.infer<typeof couponFormSchema>;

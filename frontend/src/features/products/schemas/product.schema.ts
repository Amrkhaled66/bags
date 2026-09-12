import { z } from "zod";

const optionalDecimal = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Use a valid non-negative number.")
  .optional()
  .or(z.literal(""));

const requiredDecimal = z
  .string()
  .trim()
  .min(1, "Price is required.")
  .regex(/^\d+(\.\d{1,2})?$/, "Use a valid non-negative number.");

export const productFormSchema = z.object({
  brandId: z.string(),
  sku: z.string().trim().min(1, "SKU is required.").max(100),
  name: z.string().trim().min(1, "Product name is required.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(220)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens.",
    ),
  description: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  sellerPrice: requiredDecimal,
  originalPrice: optionalDecimal,
  discountedPrice: optionalDecimal,
  lengthCm: optionalDecimal,
  widthCm: optionalDecimal,
  status: z.enum(["draft", "active", "archived"]),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  categoryIds: z.array(z.string().uuid()),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function slugifyProductName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 220);
}

export const productVariantFormSchema = z
  .object({
    colorName: z.string().trim().min(1, "Color name is required.").max(100),
    sku: z.string().trim().min(1, "Variant SKU is required.").max(150),
    imageUrl: z.string().nullable().optional(),
    isActive: z.boolean(),
    stockQuantity: z.number().int().nonnegative(),
    reservedQuantity: z.number().int().nonnegative(),
  })
  .refine((value) => value.reservedQuantity <= value.stockQuantity, {
    path: ["reservedQuantity"],
    message: "Reserved quantity cannot exceed stock quantity.",
  });

export type ProductVariantFormValues = z.infer<
  typeof productVariantFormSchema
>;

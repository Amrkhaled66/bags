import { z } from 'zod';
import { listQuerySchema } from '../../common/list-query.schema';
import { imageUrlSchema } from '../../common/image-url.schema';

export const productIdSchema = z.uuid();
export const productVariantIdSchema = z.uuid();

const nullableTextSchema = z.string().trim().nullable().optional();
const nullableUrlSchema = imageUrlSchema.nullable().optional();
const moneySchema = z.coerce
  .number()
  .nonnegative()
  .transform((value) => value.toFixed(2));
const dimensionSchema = z.coerce
  .number()
  .nonnegative()
  .transform((value) => value.toFixed(2));
const booleanQuerySchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');
const categoryIdsSchema = z
  .array(z.uuid())
  .transform((categoryIds) => [...new Set(categoryIds)]);

export const productStatusSchema = z.enum(['draft', 'active', 'archived']);

const productListQueryFields = {
  sortBy: z.enum(['createdAt', 'name', 'sellerPrice']).default('createdAt'),
  brandId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  isFeatured: booleanQuerySchema.optional(),
  isNewArrival: booleanQuerySchema.optional(),
};

export const listPublicProductsQuerySchema = listQuerySchema.safeExtend(
  productListQueryFields,
);

export const listProductsQuerySchema = listPublicProductsQuerySchema.safeExtend(
  {
    status: productStatusSchema.optional(),
  },
);

const productFieldsSchema = z.object({
  brandId: z.uuid().nullable().optional(),
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Slug must be lowercase words separated by hyphens',
    }),
  description: nullableTextSchema,
  imageUrl: nullableUrlSchema,
  sellerPrice: moneySchema,
  originalPrice: moneySchema.nullable().optional(),
  discountedPrice: moneySchema.nullable().optional(),
  lengthCm: dimensionSchema.nullable().optional(),
  widthCm: dimensionSchema.nullable().optional(),
  status: productStatusSchema,
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  categoryIds: categoryIdsSchema,
});

export const createProductSchema = productFieldsSchema.extend({
  status: productStatusSchema.default('draft'),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  categoryIds: categoryIdsSchema.default([]),
});

export const updateProductSchema = productFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const productCategoriesSchema = z.object({
  categoryIds: categoryIdsSchema,
});

const quantitySchema = z.coerce.number().int().nonnegative();

export const createProductVariantSchema = z.object({
  colorName: z.string().trim().min(1).max(100),
  sku: z.string().trim().min(1).max(150),
  imageUrl: nullableUrlSchema,
  isActive: z.boolean().default(true),
  stockQuantity: quantitySchema.default(0),
  reservedQuantity: quantitySchema.default(0),
});

export const updateProductVariantSchema = createProductVariantSchema
  .omit({
    stockQuantity: true,
    reservedQuantity: true,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const updateInventorySchema = z
  .object({
    stockQuantity: quantitySchema.optional(),
    reservedQuantity: quantitySchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })
  .refine(
    (value) =>
      value.stockQuantity === undefined ||
      value.reservedQuantity === undefined ||
      value.reservedQuantity <= value.stockQuantity,
    {
      message: 'Reserved quantity cannot exceed stock quantity',
    },
  );

export type ListProductsQueryDto = z.infer<typeof listProductsQuerySchema>;
export type ListPublicProductsQueryDto = z.infer<
  typeof listPublicProductsQuerySchema
>;
export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type ProductCategoriesDto = z.infer<typeof productCategoriesSchema>;
export type CreateProductVariantDto = z.infer<
  typeof createProductVariantSchema
>;
export type UpdateProductVariantDto = z.infer<
  typeof updateProductVariantSchema
>;
export type UpdateInventoryDto = z.infer<typeof updateInventorySchema>;

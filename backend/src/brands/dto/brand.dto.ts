import { z } from 'zod';
import { imageUrlSchema } from '../../common/image-url.schema';
import { listQuerySchema } from '../../common/list-query.schema';

export const brandIdSchema = z.uuid();
export const brandSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase words separated by hyphens',
  });

const booleanQuerySchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const brandFieldsSchema = z.object({
  name: z.string().trim().min(1).max(150),
  slug: brandSlugSchema,
  description: z.string().trim().max(5000).nullable().optional(),
  logoUrl: imageUrlSchema.nullable().optional(),
  isActive: z.boolean(),
});

export const createBrandSchema = brandFieldsSchema.extend({
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = brandFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

const brandListQueryFields = {
  sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
};

export const listPublicBrandsQuerySchema =
  listQuerySchema.safeExtend(brandListQueryFields);

export const listBrandsQuerySchema = listPublicBrandsQuerySchema.safeExtend({
  isActive: booleanQuerySchema.optional(),
});

export type CreateBrandDto = z.infer<typeof createBrandSchema>;
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;
export type ListBrandsQueryDto = z.infer<typeof listBrandsQuerySchema>;
export type ListPublicBrandsQueryDto = z.infer<
  typeof listPublicBrandsQuerySchema
>;

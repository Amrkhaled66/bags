import { z } from 'zod';
import { imageUrlSchema } from '../../common/image-url.schema';

export const variantImagesSchema = z.object({
  imageUrls: z
    .array(imageUrlSchema)
    .max(20)
    .refine(
      (urls) => new Set(urls).size === urls.length,
      'Images must be unique',
    ),
});
export type VariantImagesDto = z.infer<typeof variantImagesSchema>;

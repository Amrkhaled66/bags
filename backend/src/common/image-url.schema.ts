import { z } from 'zod';

export const imageFilenameSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/,
  );
export const imageUrlSchema = z.union([
  z.url(),
  z
    .string()
    .startsWith('/uploads/images/')
    .refine(
      (value) =>
        imageFilenameSchema.safeParse(value.slice('/uploads/images/'.length))
          .success,
    ),
]);

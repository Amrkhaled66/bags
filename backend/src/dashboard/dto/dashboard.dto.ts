import { z } from 'zod';

const timestampSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

export const dashboardOverviewQuerySchema = z
  .object({
    from: timestampSchema.optional(),
    to: timestampSchema.optional(),
    lowStockThreshold: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().max(10_000))
      .default(5),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'from must be before or equal to to',
    path: ['to'],
  });

export type DashboardOverviewQueryDto = z.infer<
  typeof dashboardOverviewQuerySchema
>;

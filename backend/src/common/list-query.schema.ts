import { z } from 'zod';

const positiveInteger = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number);
const timestamp = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

export const listQuerySchema = z
  .object({
    page: positiveInteger.pipe(z.number().int().max(1_000_000)).default(1),
    limit: positiveInteger.pipe(z.number().int().max(100)).default(20),
    search: z.string().trim().min(1).max(150).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    from: timestamp.optional(),
    to: timestamp.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'from must be before or equal to to',
    path: ['to'],
  });

export type ListQuery = z.infer<typeof listQuerySchema>;
export type DateRange = Pick<ListQuery, 'from' | 'to'>;

export function searchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
}

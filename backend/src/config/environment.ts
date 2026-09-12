import { z } from 'zod';

const postgresUrlSchema = z
  .string()
  .url()
  .refine(
    (value) =>
      value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'DATABASE_URL must use the postgres or postgresql protocol',
  );

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    DATABASE_URL: postgresUrlSchema,
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().trim().min(2).default('7d'),
    CORS_ORIGIN: z.string().trim().min(1).optional(),
    IMAGE_DIRECTORY: z.string().trim().min(1).default('uploads/images'),
    ORDER_RESERVATION_HOURS: z.coerce.number().positive().max(168).default(24),
  })
  .passthrough()
  .superRefine((environment, context) => {
    if (environment.NODE_ENV === 'production' && !environment.CORS_ORIGIN) {
      context.addIssue({
        code: 'custom',
        path: ['CORS_ORIGIN'],
        message: 'CORS_ORIGIN is required in production',
      });
    }

    for (const origin of parseCorsOrigins(environment.CORS_ORIGIN)) {
      try {
        const url = new URL(origin);
        if (
          !['http:', 'https:'].includes(url.protocol) ||
          url.origin !== origin
        ) {
          throw new Error('Invalid origin');
        }
      } catch {
        context.addIssue({
          code: 'custom',
          path: ['CORS_ORIGIN'],
          message: `Invalid CORS origin: ${origin}`,
        });
      }
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(config: Record<string, unknown>) {
  return environmentSchema.parse(config);
}

export function parseCorsOrigins(value?: string) {
  return (value ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

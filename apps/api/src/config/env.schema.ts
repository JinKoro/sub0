import { z } from 'zod';

/**
 * Boot-time env validation (ctx-security.md §8: fail fast, secrets server-side).
 * RS256 key-pair PEMs are passed via env; `\n` escapes are normalised so the
 * keys can live on a single line in `.env`.
 */
const pem = z
  .string()
  .min(1)
  .transform((v) => v.replace(/\\n/g, '\n'));

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().positive().default(3001),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    DATABASE_URL: z.string().url(),

    JWT_PRIVATE_KEY: pem,
    JWT_PUBLIC_KEY: pem,
    JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().default(900),
    JWT_REFRESH_TTL_SEC: z.coerce.number().int().positive().default(7_776_000),
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),

    // Mail (#64): MailHog locally, SMTP provider in prod.
    APP_BASE_URL: z.string().url().default('http://localhost:3000'),
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().default('Sub0 <noreply@sub0.local>'),
    MAIL_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  })
  // keep unrelated process.env entries (SMTP_*, PATH, …) so ConfigService still sees them
  .passthrough();

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

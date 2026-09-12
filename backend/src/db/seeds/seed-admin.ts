import 'dotenv/config';

import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../index';
import { admins } from '../schemas';

const requiredEnv = ['DATABASE_URL', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'];

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function seedAdmin() {
  for (const envName of requiredEnv) {
    getRequiredEnv(envName);
  }

  const email = getRequiredEnv('SEED_ADMIN_EMAIL').toLowerCase();
  const password = getRequiredEnv('SEED_ADMIN_PASSWORD');
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Main Admin';
  const role = process.env.SEED_ADMIN_ROLE?.trim() || 'super_admin';

  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters');
  }

  const pool = new Pool({
    connectionString: getRequiredEnv('DATABASE_URL'),
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  });

  const database = drizzle({ client: pool, schema });

  try {
    const [existingAdmin] = await database
      .select({ id: admins.id, email: admins.email })
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);

    if (existingAdmin) {
      console.log(`Admin already exists: ${existingAdmin.email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [admin] = await database
      .insert(admins)
      .values({
        name,
        email,
        passwordHash,
        role,
      })
      .returning({
        id: admins.id,
        email: admins.email,
        role: admins.role,
      });

    console.log(`Seeded admin: ${admin.email} (${admin.role})`);
  } finally {
    await pool.end();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

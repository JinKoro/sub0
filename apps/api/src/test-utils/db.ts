import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { Client, Pool } from 'pg';

// Base без имени БД; CI/локалка переопределяют через TEST_PG_BASE_URL.
const BASE_URL = (process.env.TEST_PG_BASE_URL ?? 'postgresql://sub0:sub0@localhost:5432').replace(
  /\/+$/,
  '',
);
const ADMIN_URL = `${BASE_URL}/postgres`;
// One DB per jest worker — spec files run in parallel.
export const TEST_DB = `sub0_test_${process.env.JEST_WORKER_ID ?? '1'}`;
export const TEST_DB_URL = `${BASE_URL}/${TEST_DB}`;

const DRIZZLE_DIR = join(__dirname, '..', '..', 'drizzle');

/** Drops & recreates sub0_test, applies every committed migration .sql. */
export async function createTestDb(): Promise<void> {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();

  const db = new Client({ connectionString: TEST_DB_URL });
  await db.connect();
  const files = readdirSync(DRIZZLE_DIR)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort();
  for (const f of files) {
    await db.query(readFileSync(join(DRIZZLE_DIR, f), 'utf8'));
  }
  await db.end();
}

export async function dropTestDb(): Promise<void> {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.end();
}

let pool: Pool | null = null;
export function testPool(): Pool {
  pool ??= new Pool({ connectionString: TEST_DB_URL });
  return pool;
}

export async function truncateAll(): Promise<void> {
  await testPool().query(
    'TRUNCATE customer, project, verification_token, refresh_token, mail_outbox RESTART IDENTITY CASCADE',
  );
}

export async function closeTestPool(): Promise<void> {
  await pool?.end();
  pool = null;
}

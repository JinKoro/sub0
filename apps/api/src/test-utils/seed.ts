import { CustomerState, NotificationChannelType, Plan } from '@subzero/shared';

import { Argon2PasswordHasher } from '../auth/password-hasher';
import { testPool } from './db';

const hasher = new Argon2PasswordHasher();

/** Inserts a customer directly (bypasses the 2-step flow) for HTTP tests.
 *  `planId` дефолтит в Plan.PRO, чтобы int-тесты не упирались в Free-лимиты
 *  (5 подписок / 1 проект). Тесты, которые целенаправленно проверяют Free,
 *  должны передать `planId: Plan.FREE` явно. */
export async function seedCustomer(opts: {
  email: string;
  password?: string;
  stateId?: number;
  planId?: number;
}): Promise<string> {
  const passwordHash = opts.password ? await hasher.hash(opts.password) : null;
  const { rows } = await testPool().query<{ id: string }>(
    `INSERT INTO customer (email, password_hash, name, timezone, state_id, plan_id)
     VALUES ($1, $2, 'Test', 'Europe/Moscow', $3, $4) RETURNING id`,
    [
      email(opts.email),
      passwordHash,
      opts.stateId ?? CustomerState.ACTIVE,
      opts.planId ?? Plan.PRO,
    ],
  );
  const id = rows[0].id;
  // Mirror prod: ACTIVE-customer'у заводится verified EMAIL-канал (backfill +
  // completeRegistration). Воркер шлёт письма только при наличии такого канала.
  if ((opts.stateId ?? CustomerState.ACTIVE) === CustomerState.ACTIVE) {
    await testPool().query(
      `INSERT INTO notification_channel (customer_id, type_id, address, verified_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (customer_id, type_id) DO NOTHING`,
      [id, NotificationChannelType.EMAIL, email(opts.email)],
    );
  }
  return id;
}

function email(e: string): string {
  return e.trim().toLowerCase();
}

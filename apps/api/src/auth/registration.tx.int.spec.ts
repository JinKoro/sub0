import type { INestApplication } from '@nestjs/common';

import { DrizzleRegistrationRepository } from './registration.repository';
import { closeTestPool, createTestDb, dropTestDb, testPool, truncateAll } from '../test-utils/db';
import { createTestApp } from '../test-utils/app';
import { seedCustomer } from '../test-utils/seed';

describe('createNewAccount transaction rollback', () => {
  let app: INestApplication;
  let repo: DrizzleRegistrationRepository;

  beforeAll(async () => {
    await createTestDb();
    app = (await createTestApp()).app;
    repo = app.get(DrizzleRegistrationRepository);
  });

  afterAll(async () => {
    await app.close();
    await closeTestPool();
    await dropTestDb();
  });

  beforeEach(() => truncateAll());

  it('rolls back customer + project when a later step (token insert) fails', async () => {
    // Occupy a token_hash so the 3rd insert inside the tx violates unique().
    const otherId = await seedCustomer({ email: 'holder@ex.com', password: 'Passw0rd1' });
    await testPool().query(
      `INSERT INTO verification_token (customer_id, type_id, token_hash, expires_at)
       VALUES ($1, 1, 'dup-token-hash', now() + interval '1 day')`,
      [otherId],
    );

    await expect(
      repo.createNewAccount({
        email: 'rollback@ex.com',
        name: 'RB',
        timezone: 'Europe/Moscow',
        localeId: 1,
        marketingConsent: false,
        sku: 'prj-ROLLBCK1',
        color: '#abcdef',
        tokenHash: 'dup-token-hash',
        verifyPath: '/registration/complete?token=x',
        expiresAt: new Date(Date.now() + 86_400_000),
      }),
    ).rejects.toBeDefined();

    const cust = await testPool().query('SELECT 1 FROM customer WHERE email=$1', [
      'rollback@ex.com',
    ]);
    const proj = await testPool().query('SELECT 1 FROM project WHERE sku=$1', ['prj-ROLLBCK1']);
    expect(cust.rowCount).toBe(0); // customer insert rolled back
    expect(proj.rowCount).toBe(0); // project insert rolled back
  });
});

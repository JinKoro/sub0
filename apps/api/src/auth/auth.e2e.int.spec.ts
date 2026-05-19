import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { MailOutboxWorker } from '../mail/mail-outbox.worker';
import { closeTestPool, createTestDb, dropTestDb, testPool, truncateAll } from '../test-utils/db';
import { createTestApp, type SentMail } from '../test-utils/app';

const PFX = '/api/v1/auth';
const tokenFrom = (m: SentMail) => /token=([^\s"&]+)/.exec(m.text)?.[1] ?? '';

describe('Registration / reset end-to-end (real DB + fake SMTP)', () => {
  let app: INestApplication;
  let sent: SentMail[];
  let http: ReturnType<typeof request>;
  let worker: MailOutboxWorker;

  beforeAll(async () => {
    await createTestDb();
    const t = await createTestApp();
    app = t.app;
    sent = t.sent;
    http = request(app.getHttpServer());
    worker = app.get(MailOutboxWorker);
  });

  afterAll(async () => {
    await app.close();
    await closeTestPool();
    await dropTestDb();
  });

  beforeEach(async () => {
    await truncateAll();
    sent.length = 0;
  });

  it('register → mail → verify-email → login', async () => {
    const email = 'chain@ex.com';
    expect(
      (await http.post(`${PFX}/register`).send({ email, name: 'C', timezone: 'Europe/Moscow' }))
        .status,
    ).toBe(200);

    const pending = await testPool().query(
      "SELECT 1 FROM mail_outbox WHERE to_email=$1 AND sent_at IS NULL AND failed_at IS NULL",
      [email],
    );
    expect(pending.rowCount).toBe(1);

    await worker.tick();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(email);
    const outbox = await testPool().query(
      'SELECT sent_at FROM mail_outbox WHERE to_email=$1',
      [email],
    );
    expect(outbox.rows[0].sent_at).not.toBeNull();

    const token = tokenFrom(sent[0]);
    expect(token.length).toBeGreaterThan(10);

    const verify = await http.post(`${PFX}/verify-email`).send({ token, password: 'Passw0rd1' });
    expect(verify.status).toBe(200);
    expect(verify.body.accessToken).toBeDefined();

    expect(
      (await http.post(`${PFX}/login`).send({ email, password: 'Passw0rd1' })).status,
    ).toBe(200);
  });

  it('forgot-password → reset-password revokes all refresh tokens', async () => {
    const email = 'reset@ex.com';
    await http.post(`${PFX}/register`).send({ email, name: 'R', timezone: 'Europe/Moscow' });
    await worker.tick();
    const vToken = tokenFrom(sent[0]);
    await http.post(`${PFX}/verify-email`).send({ token: vToken, password: 'Passw0rd1' });
    await http.post(`${PFX}/login`).send({ email, password: 'Passw0rd1' });

    const before = await testPool().query(
      `SELECT count(*)::int n FROM refresh_token r JOIN customer c ON c.id=r.customer_id
       WHERE c.email=$1 AND r.revoked_at IS NULL`,
      [email],
    );
    expect(before.rows[0].n).toBeGreaterThanOrEqual(1);

    sent.length = 0;
    expect((await http.post(`${PFX}/forgot-password`).send({ email })).status).toBe(200);
    await worker.tick();
    const rToken = tokenFrom(sent[0]);

    expect(
      (await http.post(`${PFX}/reset-password`).send({ token: rToken, newPassword: 'N3wPass99' }))
        .status,
    ).toBe(200);

    const after = await testPool().query(
      `SELECT count(*)::int n FROM refresh_token r JOIN customer c ON c.id=r.customer_id
       WHERE c.email=$1 AND r.revoked_at IS NULL`,
      [email],
    );
    expect(after.rows[0].n).toBe(0); // all refresh revoked

    expect(
      (await http.post(`${PFX}/login`).send({ email, password: 'Passw0rd1' })).status,
    ).toBe(401); // old password no longer works
    expect(
      (await http.post(`${PFX}/login`).send({ email, password: 'N3wPass99' })).status,
    ).toBe(200);
  });
});

import type { INestApplication } from '@nestjs/common';
import { CustomerState } from '@subzero/shared';
import request from 'supertest';

import { TOKEN_SERVICE, type TokenService } from './token.service';
import { closeTestPool, createTestDb, dropTestDb, testPool, truncateAll } from '../test-utils/db';
import { createTestApp } from '../test-utils/app';
import { seedCustomer } from '../test-utils/seed';

const PFX = '/api/v1/auth';

describe('Auth HTTP layer', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let tokens: TokenService;

  beforeAll(async () => {
    await createTestDb();
    const t = await createTestApp();
    app = t.app;
    http = request(app.getHttpServer());
    tokens = app.get<TokenService>(TOKEN_SERVICE);
  });

  afterAll(async () => {
    await app.close();
    await closeTestPool();
    await dropTestDb();
  });

  beforeEach(() => truncateAll());

  function cookies(res: request.Response): string[] {
    const c = res.headers['set-cookie'];
    return Array.isArray(c) ? c : c ? [c] : [];
  }
  const find = (cs: string[], name: string) => cs.find((c) => c.startsWith(`${name}=`));

  describe('POST /register', () => {
    it('200 + pending_verification on valid input, no auth cookies', async () => {
      const res = await http
        .post(`${PFX}/register`)
        .send({ email: 'New@Ex.com', name: 'New', timezone: 'Europe/Moscow' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'pending_verification', email: 'new@ex.com' });
      expect(find(cookies(res), 'sub0_session')).toBeUndefined();
    });

    it('400 on bad email', async () => {
      const res = await http
        .post(`${PFX}/register`)
        .send({ email: 'not-an-email', name: 'X', timezone: 'Europe/Moscow' });
      expect(res.status).toBe(400);
    });

    it('400 on unknown extra field (forbidNonWhitelisted)', async () => {
      const res = await http
        .post(`${PFX}/register`)
        .send({ email: 'a@b.com', name: 'X', timezone: 'Europe/Moscow', admin: true });
      expect(res.status).toBe(400);
    });

    it('409 when email belongs to an ACTIVE customer', async () => {
      await seedCustomer({ email: 'taken@ex.com', password: 'Passw0rd1' });
      const res = await http
        .post(`${PFX}/register`)
        .send({ email: 'taken@ex.com', name: 'Dup', timezone: 'Europe/Moscow' });
      expect(res.status).toBe(409);
    });

    it('409 when email belongs to a soft-deleted (ARCHIVED) customer (#73)', async () => {
      // Real lifecycle: register → verify → DELETE /me leaves an ARCHIVED row
      // with deleted_at IS NOT NULL. The partial unique index would otherwise
      // let us silently create a second customer for the same address.
      const id = await seedCustomer({ email: 'gone@ex.com', password: 'Passw0rd1' });
      await testPool().query(
        `UPDATE customer SET deleted_at = now(), state_id = $2 WHERE id = $1`,
        [id, CustomerState.ARCHIVED],
      );
      const res = await http
        .post(`${PFX}/register`)
        .send({ email: 'gone@ex.com', name: 'Again', timezone: 'Europe/Moscow' });
      expect(res.status).toBe(409);
    });
  });

  describe('POST /login', () => {
    it('200 + both cookies with correct paths/flags', async () => {
      await seedCustomer({ email: 'log@ex.com', password: 'Passw0rd1' });
      const res = await http.post(`${PFX}/login`).send({ email: 'log@ex.com', password: 'Passw0rd1' });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      const cs = cookies(res);
      const session = find(cs, 'sub0_session')!;
      const refresh = find(cs, 'refresh_token')!;
      expect(session).toMatch(/HttpOnly/i);
      expect(session).toMatch(/Path=\//);
      expect(refresh).toMatch(/Path=\/api\/v1\/auth/);
      expect(refresh).toMatch(/HttpOnly/i);
    });

    it('401 on wrong password', async () => {
      await seedCustomer({ email: 'log2@ex.com', password: 'Passw0rd1' });
      const res = await http.post(`${PFX}/login`).send({ email: 'log2@ex.com', password: 'nope' });
      expect(res.status).toBe(401);
    });

    it('401 on unknown email', async () => {
      const res = await http.post(`${PFX}/login`).send({ email: 'ghost@ex.com', password: 'x' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /refresh', () => {
    it('401 without a refresh cookie', async () => {
      const res = await http.post(`${PFX}/refresh`);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /logout (JwtAuthGuard)', () => {
    it('401 without any token', async () => {
      expect((await http.post(`${PFX}/logout`)).status).toBe(401);
    });

    it('204 + clears cookies via sub0_session cookie', async () => {
      const id = await seedCustomer({ email: 'lo@ex.com', password: 'Passw0rd1' });
      const access = tokens.signAccess({ sub: id, plan: 1 });
      const res = await http.post(`${PFX}/logout`).set('Cookie', `sub0_session=${access}`);
      expect(res.status).toBe(204);
      const cs = cookies(res).join(';');
      expect(cs).toMatch(/sub0_session=;|sub0_session=;.*Expires|Max-Age=0/);
    });

    it('204 via Authorization: Bearer access token', async () => {
      const id = await seedCustomer({ email: 'lo2@ex.com', password: 'Passw0rd1' });
      const access = tokens.signAccess({ sub: id, plan: 1 });
      const res = await http.post(`${PFX}/logout`).set('Authorization', `Bearer ${access}`);
      expect(res.status).toBe(204);
    });

    it('401 when a refresh token is presented as access (typ != access)', async () => {
      const id = await seedCustomer({ email: 'lo3@ex.com', password: 'Passw0rd1' });
      const refresh = tokens.signRefresh(id).token;
      const res = await http.post(`${PFX}/logout`).set('Authorization', `Bearer ${refresh}`);
      expect(res.status).toBe(401);
    });
  });
});

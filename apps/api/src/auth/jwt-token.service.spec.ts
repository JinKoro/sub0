import { generateKeyPairSync } from 'node:crypto';

import { JwtTokenService } from './jwt-token.service';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function make() {
  return new JwtTokenService({
    privateKey,
    publicKey,
    accessTtlSec: 900,
    refreshTtlSec: 7_776_000,
  });
}

describe('JwtTokenService', () => {
  it('signs an access token that decodes with sub and plan claims', () => {
    const svc = make();
    const token = svc.signAccess({ sub: 'cust-1', plan: 2 });
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    expect(payload.sub).toBe('cust-1');
    expect(payload.plan).toBe(2);
    expect(token.split('.')).toHaveLength(3);
  });

  it('signs a refresh token with a unique jti and a future expiry', () => {
    const svc = make();
    const a = svc.signRefresh('cust-1');
    const b = svc.signRefresh('cust-1');
    expect(a.jti).not.toBe(b.jti);
    expect(a.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('verifyRefresh round-trips sub and jti from a token it signed', () => {
    const svc = make();
    const { token, jti } = svc.signRefresh('cust-9');
    const claims = svc.verifyRefresh(token);
    expect(claims.sub).toBe('cust-9');
    expect(claims.jti).toBe(jti);
  });

  it('verifyRefresh throws on a tampered token', () => {
    const svc = make();
    const { token } = svc.signRefresh('cust-9');
    expect(() => svc.verifyRefresh(token + 'x')).toThrow();
  });

  it('verifyRefresh throws when verifying an access token (wrong token kind)', () => {
    const svc = make();
    const access = svc.signAccess({ sub: 'cust-1', plan: 1 });
    expect(() => svc.verifyRefresh(access)).toThrow();
  });

  it('hashRefresh is deterministic and not the raw token', () => {
    const svc = make();
    const h1 = svc.hashRefresh('refresh.jwt.value');
    const h2 = svc.hashRefresh('refresh.jwt.value');
    expect(h1).toBe(h2);
    expect(h1).not.toBe('refresh.jwt.value');
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });
});

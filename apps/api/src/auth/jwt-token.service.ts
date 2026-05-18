import { createHash, randomUUID } from 'node:crypto';

import { JwtService } from '@nestjs/jwt';

import type { RefreshClaims, SignedRefresh, TokenService } from './token.service';

export interface JwtTokenOptions {
  privateKey: string;
  publicKey: string;
  accessTtlSec: number;
  refreshTtlSec: number;
}

export class JwtTokenService implements TokenService {
  private readonly jwt: JwtService;

  constructor(private readonly opts: JwtTokenOptions) {
    this.jwt = new JwtService({
      privateKey: opts.privateKey,
      publicKey: opts.publicKey,
      signOptions: { algorithm: 'RS256' },
      verifyOptions: { algorithms: ['RS256'] },
    });
  }

  signAccess(claims: { sub: string; plan: number }): string {
    return this.jwt.sign(
      { sub: claims.sub, plan: claims.plan, typ: 'access' },
      { expiresIn: this.opts.accessTtlSec },
    );
  }

  signRefresh(sub: string): SignedRefresh {
    const jti = randomUUID();
    const token = this.jwt.sign({ sub, jti, typ: 'refresh' }, { expiresIn: this.opts.refreshTtlSec });
    return { token, jti, expiresAt: new Date(Date.now() + this.opts.refreshTtlSec * 1000) };
  }

  verifyRefresh(token: string): RefreshClaims {
    const payload = this.jwt.verify<{ sub: string; jti: string; typ?: string }>(token);
    if (payload.typ !== 'refresh') {
      throw new Error('not a refresh token');
    }
    return { sub: payload.sub, jti: payload.jti };
  }

  hashRefresh(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

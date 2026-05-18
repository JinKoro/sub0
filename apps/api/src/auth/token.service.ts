export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface SignedRefresh {
  token: string;
  jti: string;
  expiresAt: Date;
}

export interface RefreshClaims {
  sub: string;
  jti: string;
}

export interface TokenService {
  signAccess(claims: { sub: string; plan: number }): string;
  signRefresh(sub: string): SignedRefresh;
  verifyRefresh(token: string): RefreshClaims;
  hashRefresh(token: string): string;
}

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export const JWT_PUBLIC_KEY = Symbol('JWT_PUBLIC_KEY');

// The browser session is the httpOnly sub0_session cookie (JS can't read it
// to send a Bearer header), so guarded routes must accept it from the cookie.
const fromSessionCookie = (req: Request): string | null =>
  (req?.cookies as Record<string, string> | undefined)?.sub0_session ?? null;

interface AccessPayload {
  sub: string;
  plan: number;
  typ?: string;
}

export interface AuthUser {
  id: string;
  plan: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(JWT_PUBLIC_KEY) publicKey: string) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromSessionCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    });
  }

  validate(payload: AccessPayload): AuthUser {
    if (payload.typ !== 'access') {
      throw new UnauthorizedException();
    }
    return { id: payload.sub, plan: payload.plan };
  }
}

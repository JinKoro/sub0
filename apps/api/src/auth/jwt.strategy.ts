import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export const JWT_PUBLIC_KEY = Symbol('JWT_PUBLIC_KEY');

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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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

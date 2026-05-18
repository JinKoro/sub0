import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protects routes with a valid RS256 access token; puts AuthUser on req.user. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

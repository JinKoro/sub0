import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import type { RequestContext } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailOnlyDto, ResetPasswordDto, VerifyEmailDto } from './dto/verification.dto';
import { VerificationService } from './verification.service';
import type { AuthUser } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

const REFRESH_COOKIE = 'refresh_token';
// Real mounted path is /api/v1/auth (global prefix). ctx-security.md §2:
// scope the refresh cookie to the auth routes only.
const REFRESH_PATH = '/api/v1/auth';

// ctx-security.md §2: access-JWT mirrored into a Path=/ cookie so the web
// middleware can gate cabinet routes statelessly (RS256 verify, no API call).
const SESSION_COOKIE = 'sub0_session';

function ctxOf(req: Request): RequestContext {
  return {
    userAgent: req.headers['user-agent']?.slice(0, 255) ?? null,
    ip: req.ip ?? null,
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly verification: VerificationService,
    private readonly config: ConfigService,
  ) {}

  private get secure(): boolean {
    return this.config.get<boolean>('COOKIE_SECURE') ?? true;
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: REFRESH_PATH,
      maxAge: (this.config.get<number>('JWT_REFRESH_TTL_SEC') ?? 7_776_000) * 1000,
    });
  }

  private setSessionCookie(res: Response, accessToken: string): void {
    res.cookie(SESSION_COOKIE, accessToken, {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: '/',
      maxAge: (this.config.get<number>('JWT_ACCESS_TTL_SEC') ?? 900) * 1000,
    });
  }

  private issue(res: Response, accessToken: string, refreshToken: string): { accessToken: string } {
    this.setRefreshCookie(res, refreshToken);
    this.setSessionCookie(res, accessToken);
    return { accessToken };
  }

  @Post('register')
  @HttpCode(200)
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    // No tokens — the customer has no password yet (set via #54 verify-email).
    return this.auth.register(dto, ctxOf(req));
  }

  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.verification.verifyEmail(dto, ctxOf(req));
    if ('accessToken' in result) {
      this.issue(res, result.accessToken, result.refreshToken);
      return { accessToken: result.accessToken, customer: result.customer };
    }
    return result; // { status: 'email_updated' }
  }

  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@Body() dto: EmailOnlyDto) {
    return this.verification.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: EmailOnlyDto) {
    return this.verification.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.verification.resetPassword(dto.token, dto.newPassword);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await this.auth.login(dto, ctxOf(req));
    return this.issue(res, accessToken, refreshToken);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const presented = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    if (!presented) {
      throw new UnauthorizedException();
    }
    const { accessToken, refreshToken } = await this.auth.refresh(presented, ctxOf(req));
    return this.issue(res, accessToken, refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout((req.user as AuthUser).id);
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }
}

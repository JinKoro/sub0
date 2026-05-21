import { Body, Controller, Delete, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { CustomerService } from './customer.service';
import type { CustomerProfile } from './customer.types';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PreferencesDto } from './dto/preferences.dto';
import { ProfileDto } from './dto/profile.dto';
import type { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Same names/paths as AuthController — must match for clearCookie to take effect.
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_PATH = '/api/v1/auth';
const SESSION_COOKIE = 'sub0_session';

function uid(req: Request): string {
  return (req.user as AuthUser).id;
}

// Project HTTP convention: GET reads, POST writes, DELETE deletes — no PATCH.
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customers: CustomerService) {}

  @Get('me')
  getMe(@Req() req: Request): Promise<CustomerProfile> {
    return this.customers.getMe(uid(req));
  }

  // Profile card → name (avatar is deferred until file infra #6).
  // 200 OK — the customer already exists; only POST /auth/register/etc create.
  @Post('me/profile')
  @HttpCode(200)
  saveProfile(@Req() req: Request, @Body() dto: ProfileDto): Promise<CustomerProfile> {
    return this.customers.saveProfile(uid(req), dto.version, { name: dto.name });
  }

  // Region & format card → locale / timezone / currency in one request.
  @Post('me/preferences')
  @HttpCode(200)
  savePreferences(@Req() req: Request, @Body() dto: PreferencesDto): Promise<CustomerProfile> {
    return this.customers.saveProfile(uid(req), dto.version, {
      localeId: dto.localeId,
      timezone: dto.timezone,
      currencyId: dto.currencyId,
    });
  }

  @Post('me/password')
  @HttpCode(204)
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto): Promise<void> {
    await this.customers.changePassword(uid(req), dto.currentPassword, dto.newPassword);
  }

  @Delete('me/subscriptions')
  @HttpCode(204)
  async purgeSubscriptions(@Req() req: Request): Promise<void> {
    await this.customers.purgeSubscriptions(uid(req));
  }

  @Delete('me')
  @HttpCode(204)
  async deleteMe(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.customers.deleteMe(uid(req));
    // Force-logout the current device: service already revoked refresh tokens
    // for the customer (#16), but the access cookie lives ≤15 min. Without
    // clearing it the user can still hit /dashboard until the JWT expires (#73).
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
  }
}

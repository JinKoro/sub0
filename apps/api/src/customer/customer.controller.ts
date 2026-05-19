import { Body, Controller, Delete, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { CustomerService } from './customer.service';
import type { CustomerProfile } from './customer.types';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PreferencesDto } from './dto/preferences.dto';
import { ProfileDto } from './dto/profile.dto';
import type { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  @Post('me/profile')
  saveProfile(@Req() req: Request, @Body() dto: ProfileDto): Promise<CustomerProfile> {
    return this.customers.saveProfile(uid(req), dto.version, { name: dto.name });
  }

  // Region & format card → locale / timezone / currency in one request.
  @Post('me/preferences')
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

  @Delete('me')
  @HttpCode(204)
  async deleteMe(@Req() req: Request): Promise<void> {
    await this.customers.deleteMe(uid(req));
  }
}

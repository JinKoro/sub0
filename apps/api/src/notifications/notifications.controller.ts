import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { NotificationSettingsDto, QuietHoursDto } from '@subzero/shared';

import type { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateQuietHoursDto } from './dto/update-quiet-hours.dto';
import { NotificationsService } from './notifications.service';

function uid(req: Request): string {
  return (req.user as AuthUser).id;
}

// Используем POST для апдейтов: проект договорился без PATCH/PUT
// (memory: HTTP methods — POST/GET/DELETE only).
@Controller('customers/me')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('notifications')
  get(@Req() req: Request): Promise<NotificationSettingsDto> {
    return this.notifications.getSettings(uid(req));
  }

  @Post('notifications/preferences')
  @HttpCode(200)
  updatePreferences(
    @Req() req: Request,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<NotificationSettingsDto> {
    return this.notifications.updatePreferences(uid(req), { items: dto.items });
  }

  @Post('quiet-hours')
  @HttpCode(200)
  updateQuietHours(
    @Req() req: Request,
    @Body() dto: UpdateQuietHoursDto,
  ): Promise<QuietHoursDto> {
    return this.notifications.updateQuietHours(uid(req), {
      enabled: dto.enabled,
      from: dto.from ?? null,
      to: dto.to ?? null,
      version: dto.version,
    });
  }
}

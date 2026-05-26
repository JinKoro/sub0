import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { BillingHistoryListResponse } from '@subzero/shared';

import type { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingHistoryService } from './billing-history.service';
import { ListBillingHistoryDto } from './dto/list-billing-history.dto';

function uid(req: Request): string {
  return (req.user as AuthUser).id;
}

@Controller('billing-history')
@UseGuards(JwtAuthGuard)
export class BillingHistoryController {
  constructor(private readonly history: BillingHistoryService) {}

  @Get()
  list(
    @Req() req: Request,
    @Query() q: ListBillingHistoryDto,
  ): Promise<BillingHistoryListResponse> {
    return this.history.list(uid(req), q);
  }
}

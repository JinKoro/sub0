import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { PaymentListResponse } from '@subzero/shared';

import type { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { PaymentService } from './payment.service';

function uid(req: Request): string {
  return (req.user as AuthUser).id;
}

// История платежей юзера. Точка для Settings → Billing → InvoiceTable.
// Single-resource per customer, поэтому путь scoped через /customers/me/...
@Controller('customers/me/payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Get()
  list(@Req() req: Request, @Query() q: ListPaymentsDto): Promise<PaymentListResponse> {
    return this.payments.list(uid(req), { page: q.page, pageSize: q.pageSize });
  }
}

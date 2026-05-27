import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { PaymentDto, PaymentListResponse } from '@subzero/shared';

import type { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { UpgradePaymentDto } from './dto/upgrade-payment.dto';
import { PaymentService } from './payment.service';

function uid(req: Request): string {
  return (req.user as AuthUser).id;
}

// История платежей и mock-апгрейд тарифа. Single-resource per customer,
// поэтому путь scoped через /customers/me/...
@Controller('customers/me')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Get('payments')
  list(@Req() req: Request, @Query() q: ListPaymentsDto): Promise<PaymentListResponse> {
    return this.payments.list(uid(req), { page: q.page, pageSize: q.pageSize });
  }

  @Post('upgrade')
  @HttpCode(200)
  upgrade(@Req() req: Request, @Body() dto: UpgradePaymentDto): Promise<PaymentDto> {
    return this.payments.upgrade(uid(req), dto.paidPlanId);
  }
}

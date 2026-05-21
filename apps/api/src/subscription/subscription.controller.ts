import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  SubscriptionDto,
  SubscriptionListResponse,
} from '@subzero/shared';

import type { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionService } from './subscription.service';

function uid(req: Request): string {
  return (req.user as AuthUser).id;
}

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subs: SubscriptionService) {}

  @Get()
  list(
    @Req() req: Request,
    @Query() q: ListSubscriptionsDto,
  ): Promise<SubscriptionListResponse> {
    return this.subs.list(uid(req), q);
  }

  @Get(':sku')
  get(@Req() req: Request, @Param('sku') sku: string): Promise<SubscriptionDto> {
    return this.subs.get(uid(req), sku);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateSubscriptionDto): Promise<SubscriptionDto> {
    return this.subs.create(uid(req), dto);
  }

  @Post(':sku')
  @HttpCode(200)
  update(
    @Req() req: Request,
    @Param('sku') sku: string,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDto> {
    return this.subs.update(uid(req), sku, dto);
  }

  @Delete(':sku')
  @HttpCode(204)
  async delete(@Req() req: Request, @Param('sku') sku: string): Promise<void> {
    await this.subs.delete(uid(req), sku);
  }
}

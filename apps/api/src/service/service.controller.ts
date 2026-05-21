import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { ServiceListResponse } from '@subzero/shared';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListServicesDto } from './dto/list-services.dto';
import { ServiceService } from './service.service';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServiceController {
  constructor(private readonly services: ServiceService) {}

  @Get()
  list(@Query() q: ListServicesDto): Promise<ServiceListResponse> {
    return this.services.list({
      categorySku: q.categorySku,
      q: q.q,
      limit: q.limit,
    });
  }
}

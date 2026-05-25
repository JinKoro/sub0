import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, ilike, sql, type SQL } from 'drizzle-orm';
import type { ServiceDto } from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { category } from '../db/schema/category';
import { service } from '../db/schema/service';
import type { ServiceFilter, ServiceRepository } from './service.types';

@Injectable()
export class DrizzleServiceRepository implements ServiceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listActive(
    filter: ServiceFilter,
  ): Promise<{ items: ServiceDto[]; total: number }> {
    const where: SQL[] = [eq(service.isActive, true)];
    if (filter.categorySku) where.push(eq(category.sku, filter.categorySku));
    if (filter.q) where.push(ilike(service.name, `%${filter.q}%`));

    const whereExpr = where.length === 1 ? where[0] : and(...where);

    const items = await this.db
      .select({
        sku: service.sku,
        name: service.name,
        icon: service.icon,
        categorySku: category.sku,
        cancelUrl: service.cancelUrl,
        pricingUrl: service.pricingUrl,
      })
      .from(service)
      .innerJoin(category, eq(service.categoryId, category.id))
      .where(whereExpr)
      .orderBy(asc(service.name))
      .limit(filter.limit);

    const [{ count }] = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(service)
      .innerJoin(category, eq(service.categoryId, category.id))
      .where(whereExpr);

    return { items, total: count };
  }
}

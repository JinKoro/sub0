import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import type { CategoryDto } from '@subzero/shared';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { category } from '../db/schema/category';
import type { CategoryRepository } from './category.types';

@Injectable()
export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listAll(): Promise<CategoryDto[]> {
    const rows = await this.db
      .select({
        sku: category.sku,
        nameRu: category.nameRu,
        nameEn: category.nameEn,
        color: category.color,
      })
      .from(category)
      .orderBy(asc(category.nameRu));
    return rows.map((r) => ({ ...r, color: r.color ?? null }));
  }
}

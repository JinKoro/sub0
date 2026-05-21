import type { ServiceListResponse } from '@subzero/shared';

import type { ServiceFilter, ServiceRepository } from './service.types';

const DEFAULT_LIMIT = 20;

export class ServiceService {
  constructor(private readonly repo: ServiceRepository) {}

  list(filter: Partial<ServiceFilter>): Promise<ServiceListResponse> {
    const f: ServiceFilter = {
      categorySku: filter.categorySku,
      q: filter.q?.trim() || undefined,
      limit: filter.limit ?? DEFAULT_LIMIT,
    };
    return this.repo.listActive(f);
  }
}

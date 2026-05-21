import type { ServiceDto } from '@subzero/shared';

export interface ServiceFilter {
  categorySku?: string;
  q?: string;
  limit: number;
}

export interface ServiceRepository {
  listActive(filter: ServiceFilter): Promise<{ items: ServiceDto[]; total: number }>;
}

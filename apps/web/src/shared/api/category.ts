import type { CategoryDto } from '@subzero/shared';

import { api } from './client';

export function listCategories(): Promise<CategoryDto[]> {
  return api<CategoryDto[]>('/categories');
}

export type { CategoryDto };

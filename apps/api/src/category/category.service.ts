import type { CategoryDto } from '@subzero/shared';

import type { CategoryRepository } from './category.types';

export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}

  list(): Promise<CategoryDto[]> {
    return this.repo.listAll();
  }
}

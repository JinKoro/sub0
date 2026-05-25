import type { CategoryDto } from '@subzero/shared';

export interface CategoryRepository {
  listAll(): Promise<CategoryDto[]>;
}

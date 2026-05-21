import { Module } from '@nestjs/common';

import { CategoryController } from './category.controller';
import { DrizzleCategoryRepository } from './category.repository';
import { CategoryService } from './category.service';

@Module({
  controllers: [CategoryController],
  providers: [
    DrizzleCategoryRepository,
    {
      provide: CategoryService,
      useFactory: (repo: DrizzleCategoryRepository) => new CategoryService(repo),
      inject: [DrizzleCategoryRepository],
    },
  ],
})
export class CategoryModule {}

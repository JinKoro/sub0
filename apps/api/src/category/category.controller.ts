import { Controller, Get, UseGuards } from '@nestjs/common';
import type { CategoryDto } from '@subzero/shared';

import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  @Get()
  list(): Promise<CategoryDto[]> {
    return this.categories.list();
  }
}

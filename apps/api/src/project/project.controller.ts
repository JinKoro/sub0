import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectService } from './project.service';
import type { ProjectDto } from './project.types';
import type { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

function uid(req: Request): string {
  return (req.user as AuthUser).id;
}

// Project HTTP convention: GET reads, POST writes, DELETE deletes — no PATCH.
// Public id over the wire is `sku` (ctx-architecture.md §2). UUID never leaves
// the database — clients address resources by their stable SKU.
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projects: ProjectService) {}

  @Get()
  list(@Req() req: Request): Promise<ProjectDto[]> {
    return this.projects.list(uid(req));
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateProjectDto): Promise<ProjectDto> {
    return this.projects.create(uid(req), dto.name, dto.color);
  }

  // 200 OK — the resource already existed; only POST /projects (create) is 201.
  @Post(':sku')
  @HttpCode(200)
  update(
    @Req() req: Request,
    @Param('sku') sku: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    return this.projects.update(
      uid(req),
      sku,
      { name: dto.name, color: dto.color },
      dto.version,
    );
  }

  @Delete(':sku')
  @HttpCode(204)
  async delete(@Req() req: Request, @Param('sku') sku: string): Promise<void> {
    await this.projects.delete(uid(req), sku);
  }
}

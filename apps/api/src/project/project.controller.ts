import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
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

  // Same URL for update (name and/or color). Matches the project's
  // POST-for-writes convention (no PATCH). 200 OK — the resource already
  // existed; only POST /projects (create) is 201 Created.
  @Post(':id')
  @HttpCode(200)
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    return this.projects.update(
      uid(req),
      id,
      { name: dto.name, color: dto.color },
      dto.version,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.projects.delete(uid(req), id);
  }
}

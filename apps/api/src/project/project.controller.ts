import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { CreateProjectDto } from './dto/create-project.dto';
import { RenameProjectDto } from './dto/rename-project.dto';
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

  @Post(':id/rename')
  rename(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenameProjectDto,
  ): Promise<ProjectDto> {
    return this.projects.rename(uid(req), id, dto.name, dto.version);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.projects.delete(uid(req), id);
  }
}

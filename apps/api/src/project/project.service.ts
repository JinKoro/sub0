import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import type { ProjectDto, ProjectRepository, ProjectUpdate } from './project.types';
import { randomProjectColor } from '../shared/project-color';
import { generateSku } from '../shared/sku';

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export class ProjectService {
  constructor(private readonly repo: ProjectRepository) {}

  list(customerId: string): Promise<ProjectDto[]> {
    return this.repo.listActive(customerId);
  }

  async create(customerId: string, name: string, color?: string): Promise<ProjectDto> {
    const trimmed = name.trim();
    const safeColor = color && HEX_COLOR_RE.test(color) ? color : randomProjectColor();
    return this.repo.create({
      customerId,
      sku: generateSku('prj'),
      name: trimmed,
      color: safeColor,
    });
  }

  async update(
    customerId: string,
    projectId: string,
    patch: ProjectUpdate,
    version: number,
  ): Promise<ProjectDto> {
    const cleaned: ProjectUpdate = {};
    if (patch.name !== undefined) cleaned.name = patch.name.trim();
    if (patch.color !== undefined) {
      if (!HEX_COLOR_RE.test(patch.color)) {
        throw new BadRequestException('color must be #RRGGBB');
      }
      cleaned.color = patch.color;
    }
    if (Object.keys(cleaned).length === 0) {
      throw new BadRequestException('no fields to update');
    }

    const existing = await this.repo.findActiveById(customerId, projectId);
    if (!existing) {
      throw new NotFoundException('project not found');
    }

    const applied = await this.repo.update({
      customerId,
      projectId,
      version,
      patch: cleaned,
    });
    if (!applied) {
      throw new ConflictException('version mismatch');
    }

    const after = await this.repo.findActiveById(customerId, projectId);
    if (!after) {
      // Theoretically unreachable — we just updated it.
      throw new NotFoundException('project not found');
    }
    return after;
  }

  /**
   * Cascade hard-delete. Refuses if this would leave the customer with no
   * active project (UI needs at least one to scope subscriptions to).
   */
  async delete(customerId: string, projectId: string): Promise<void> {
    const existing = await this.repo.findActiveById(customerId, projectId);
    if (!existing) {
      throw new NotFoundException('project not found');
    }
    const activeCount = await this.repo.countActive(customerId);
    if (activeCount <= 1) {
      throw new UnprocessableEntityException('cannot delete the only active project');
    }
    await this.repo.hardDelete(customerId, projectId);
  }
}

import { api } from './client';

export interface ProjectDto {
  id: string;
  sku: string;
  name: string;
  color: string;
  subscriptionsCount: number;
  version: number;
}

export function listProjects(): Promise<ProjectDto[]> {
  return api<ProjectDto[]>('/projects');
}

export function createProject(name: string, color?: string): Promise<ProjectDto> {
  return api<ProjectDto>('/projects', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim(), ...(color ? { color } : {}) }),
  });
}

export function renameProject(id: string, name: string, version: number): Promise<ProjectDto> {
  return api<ProjectDto>(`/projects/${id}/rename`, {
    method: 'POST',
    body: JSON.stringify({ name: name.trim(), version }),
  });
}

export function deleteProject(id: string): Promise<void> {
  return api<void>(`/projects/${id}`, { method: 'DELETE' });
}

import { api } from './client';

export interface ProjectDto {
  id: string;
  sku: string;
  name: string;
  color: string;
  subscriptionsCount: number;
  version: number;
}

export interface ProjectUpdate {
  name?: string;
  color?: string;
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

export function updateProject(
  id: string,
  patch: ProjectUpdate,
  version: number,
): Promise<ProjectDto> {
  const body: Record<string, unknown> = { version };
  if (patch.name !== undefined) body.name = patch.name.trim();
  if (patch.color !== undefined) body.color = patch.color;
  return api<ProjectDto>(`/projects/${id}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function deleteProject(id: string): Promise<void> {
  return api<void>(`/projects/${id}`, { method: 'DELETE' });
}

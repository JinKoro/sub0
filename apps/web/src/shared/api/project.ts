import { api } from './client';

export interface ProjectDto {
  /** Internal UUID — kept for debugging/keys, but URLs use `sku`. */
  id: string;
  /** Public identifier used in routes and API URLs. */
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
  sku: string,
  patch: ProjectUpdate,
  version: number,
): Promise<ProjectDto> {
  const body: Record<string, unknown> = { version };
  if (patch.name !== undefined) body.name = patch.name.trim();
  if (patch.color !== undefined) body.color = patch.color;
  return api<ProjectDto>(`/projects/${sku}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function deleteProject(sku: string): Promise<void> {
  return api<void>(`/projects/${sku}`, { method: 'DELETE' });
}

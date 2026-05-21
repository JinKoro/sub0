'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  createProject,
  deleteProject as deleteProjectReq,
  listProjects,
  updateProject as updateProjectReq,
  type ProjectDto,
  type ProjectUpdate,
} from '@/shared/api/project';

interface ProjectsCtx {
  projects: ProjectDto[];
  loading: boolean;
  error: string | null;
  create: (name: string, color?: string) => Promise<ProjectDto>;
  update: (sku: string, patch: ProjectUpdate, version: number) => Promise<ProjectDto>;
  remove: (sku: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<ProjectsCtx>({
  projects: [],
  loading: true,
  error: null,
  create: async () => {
    throw new Error('ProjectsProvider not mounted');
  },
  update: async () => {
    throw new Error('ProjectsProvider not mounted');
  },
  remove: async () => {},
  refresh: async () => {},
});

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setProjects(await listProjects());
      setError(null);
    } catch {
      setError('Не удалось загрузить проекты');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    listProjects()
      .then((list) => alive && setProjects(list))
      .catch(() => alive && setError('Не удалось загрузить проекты'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const create = useCallback(async (name: string, color?: string) => {
    const p = await createProject(name, color);
    setProjects((prev) => [...prev, p]);
    return p;
  }, []);

  const update = useCallback(async (sku: string, patch: ProjectUpdate, version: number) => {
    const p = await updateProjectReq(sku, patch, version);
    setProjects((prev) => prev.map((x) => (x.sku === sku ? p : x)));
    return p;
  }, []);

  const remove = useCallback(async (sku: string) => {
    await deleteProjectReq(sku);
    setProjects((prev) => prev.filter((x) => x.sku !== sku));
  }, []);

  return (
    <Ctx.Provider value={{ projects, loading, error, create, update, remove, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProjects() {
  return useContext(Ctx);
}

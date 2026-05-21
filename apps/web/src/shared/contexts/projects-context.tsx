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
  renameProject as renameProjectReq,
  type ProjectDto,
} from '@/shared/api/project';

interface ProjectsCtx {
  projects: ProjectDto[];
  loading: boolean;
  /** Last failure message (if any) from a list/mutation call. */
  error: string | null;
  create: (name: string) => Promise<ProjectDto>;
  rename: (id: string, name: string, version: number) => Promise<ProjectDto>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<ProjectsCtx>({
  projects: [],
  loading: true,
  error: null,
  create: async () => {
    throw new Error('ProjectsProvider not mounted');
  },
  rename: async () => {
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

  const create = useCallback(async (name: string) => {
    const p = await createProject(name);
    setProjects((prev) => [...prev, p]);
    return p;
  }, []);

  const rename = useCallback(async (id: string, name: string, version: number) => {
    const p = await renameProjectReq(id, name, version);
    setProjects((prev) => prev.map((x) => (x.id === id ? p : x)));
    return p;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteProjectReq(id);
    setProjects((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ projects, loading, error, create, rename, remove, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProjects() {
  return useContext(Ctx);
}

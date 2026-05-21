'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SUB0 } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useProjects } from '@/shared/contexts/projects-context';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { Card } from '@/shared/components/ui/Card';
import { ProjShell } from './ProjShell';
import { ProjectForm } from './ProjectForm';

interface Props {
  sku: string;
}

export function ProjectEditView({ sku }: Props) {
  const { t } = useLang();
  const router = useRouter();
  const { projects, loading, update, remove } = useProjects();
  const { project: currentSku, setProject } = useCabinet();
  const goList = () => router.push('/account/projects');

  const editing = projects.find((p) => p.sku === sku);

  // Project missing post-load (deleted elsewhere or bogus URL) → bounce back.
  useEffect(() => {
    if (!loading && !editing) {
      router.replace('/account/projects');
    }
  }, [loading, editing, router]);

  if (loading || !editing) {
    return (
      <ProjShell
        eyebrow={t('Редактирование проекта', 'Edit project')}
        title={t('Загрузка…', 'Loading…')}
        onBack={goList}
      >
        <Card padding={0}>
          <div style={{ padding: 24, color: SUB0.muted, fontSize: 14 }}>
            {t('Загрузка…', 'Loading…')}
          </div>
        </Card>
      </ProjShell>
    );
  }

  return (
    <ProjShell
      eyebrow={t('Редактирование проекта', 'Edit project')}
      title={editing.name}
      onBack={goList}
    >
      <Card padding={0}>
        <ProjectForm
          initial={editing}
          onSave={async (name, color, version) => {
            await update(editing.sku, { name, color }, version);
            goList();
          }}
          onCancel={goList}
          onDelete={async () => {
            await remove(editing.sku);
            // If the deleted project was selected in the cabinet, fall back to 'all'.
            if (currentSku === editing.sku) setProject('all');
            goList();
          }}
        />
      </Card>
    </ProjShell>
  );
}

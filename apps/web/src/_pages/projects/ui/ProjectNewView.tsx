'use client';

import { useRouter } from 'next/navigation';
import { useLang } from '@/shared/contexts/lang-context';
import { useProjects } from '@/shared/contexts/projects-context';
import { Card } from '@/shared/components/ui/Card';
import { ProjShell } from './ProjShell';
import { ProjectForm } from './ProjectForm';

export function ProjectNewView() {
  const { t } = useLang();
  const router = useRouter();
  const { create } = useProjects();
  const goList = () => router.push('/account/projects');

  return (
    <ProjShell
      eyebrow={t('Новый проект', 'New project')}
      title={t('Новый проект', 'New project')}
      onBack={goList}
    >
      <Card padding={0}>
        <ProjectForm
          onSave={async (name, color) => {
            await create(name, color);
            goList();
          }}
          onCancel={goList}
        />
      </Card>
    </ProjShell>
  );
}

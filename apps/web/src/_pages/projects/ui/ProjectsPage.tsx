'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useProjects } from '@/shared/contexts/projects-context';
import { Card } from '@/shared/components/ui/Card';
import { CabinetCtaButton } from '@/shared/components/ui/CabinetCtaButton';
import { ProjShell } from './ProjShell';
import { ProjectForm } from './ProjectForm';
import { ProjectListRow } from './ProjectListRow';

export function ProjectsPage() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const router = useRouter();
  const params = useSearchParams();
  const { projects, loading, create, update, remove } = useProjects();

  const newMode = params.get('new') !== null;
  const editId = params.get('id');

  const goList = () => router.push('/account/projects');
  const goEdit = (id: string) => router.push(`/account/projects?id=${id}`);

  // --- NEW ---
  if (newMode) {
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

  // --- EDIT ---
  if (editId) {
    if (loading) {
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
    const editing = projects.find((p) => p.id === editId);
    if (!editing) {
      // Likely deleted in another tab — bounce back to the list.
      goList();
      return null;
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
              await update(editing.id, { name, color }, version);
              goList();
            }}
            onCancel={goList}
            onDelete={async () => {
              await remove(editing.id);
              goList();
            }}
          />
        </Card>
      </ProjShell>
    );
  }

  // --- LIST ---
  return (
    <div
      style={{
        maxWidth: 1320,
        margin: '0 auto',
        padding: isMobile ? '20px 16px' : '32px 28px',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontFamily: mono,
            color: SUB0.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          {t('Рабочее пространство', 'Workspace')}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 28 : 36,
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            {t('Проекты', 'Projects')}
          </h1>
          {projects.length > 0 && (
            <CabinetCtaButton href="/account/projects?new=1">
              + {t('Новый проект', 'New project')}
            </CabinetCtaButton>
          )}
        </div>
      </div>

      <Card padding={0}>
        {projects.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: isMobile ? '12px 16px' : '12px 24px',
              fontSize: 11,
              fontFamily: mono,
              color: SUB0.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderBottom: `1px solid ${SUB0.line}`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>{t('Проект', 'Project')}</div>
            {!isMobile && (
              <div style={{ flex: 1, minWidth: 0 }}>
                {t('Подписок', 'Subscriptions')}
              </div>
            )}
            <div style={{ width: 16, flexShrink: 0 }} />
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                margin: '0 auto 14px',
                background: SUB0.soft,
                border: `1px dashed ${SUB0.line}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: SUB0.muted,
                fontFamily: mono,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              ▦
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: SUB0.ink }}>
              {t('Пока нет проектов', 'No projects yet')}
            </div>
            <div
              style={{
                fontSize: 12,
                color: SUB0.muted,
                marginTop: 6,
                lineHeight: 1.5,
                maxWidth: 320,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {t(
                'Создайте первый проект, чтобы разделить подписки по контекстам.',
                'Create your first project to split subscriptions by context.',
              )}
            </div>
            <div style={{ marginTop: 16, display: 'inline-flex' }}>
              <CabinetCtaButton href="/account/projects?new=1">
                + {t('Новый проект', 'New project')}
              </CabinetCtaButton>
            </div>
          </div>
        )}

        {loading && projects.length === 0 && (
          <div
            style={{
              padding: 24,
              color: SUB0.muted,
              fontSize: 14,
              textAlign: 'center',
            }}
          >
            {t('Загрузка…', 'Loading…')}
          </div>
        )}

        {projects.map((p, i) => (
          <ProjectListRow
            key={p.id}
            project={p}
            onOpen={() => goEdit(p.id)}
            last={i === projects.length - 1}
          />
        ))}
      </Card>

      {/* Note about "All projects" */}
      <div
        style={{
          marginTop: 18,
          padding: isMobile ? '12px 14px' : '14px 18px',
          background: SUB0.soft,
          border: `1px solid ${SUB0.line}`,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: SUB0.ink,
            color: SUB0.bg,
            fontFamily: mono,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          i
        </span>
        <div style={{ fontSize: 12, color: SUB0.muted, lineHeight: 1.55 }}>
          <span style={{ color: SUB0.ink, fontWeight: 700 }}>
            {t('«Все проекты»', '“All projects”')}
          </span>{' '}
          {t(
            '— это общий вид в кабинете, который показывает подписки из всех ваших проектов одновременно.',
            'is a combined view that shows subscriptions across all your projects at once.',
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { useProjects } from '@/shared/contexts/projects-context';
import { ProjectMarker } from '@/shared/components/ui/ProjectMarker';
import { ProjectsModal } from './ProjectsModal';

interface Props {
  isMobile?: boolean;
}

const ALL_COLOR = '#0a0a0a';

export function ProjectSwitcher({ isMobile = false }: Props) {
  const { t } = useLang();
  const { project, setProject } = useCabinet();
  const { projects, loading } = useProjects();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [focusCreate, setFocusCreate] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // If the selected project disappears (deleted in another tab / after delete here)
  // fall back to the synthetic "all" filter so the UI stays consistent.
  useEffect(() => {
    if (loading) return;
    if (project === 'all') return;
    if (!projects.some((p) => p.id === project)) {
      setProject('all');
    }
  }, [loading, projects, project, setProject]);

  const currentReal = projects.find((p) => p.id === project);
  const currentName =
    project === 'all' || !currentReal
      ? t('Все проекты', 'All projects')
      : currentReal.name;
  const currentColor = currentReal?.color ?? ALL_COLOR;
  const isAll = project === 'all' || !currentReal;

  const openModal = (focus: boolean) => {
    setFocusCreate(focus);
    setModalOpen(true);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: isMobile ? '6px 10px' : '7px 12px',
          background: SUB0.panel,
          border: `1px solid ${SUB0.line}`,
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: 'inherit',
          maxWidth: isMobile ? 160 : 'none',
        }}
      >
        <ProjectMarker color={currentColor} aggregate={isAll} size={20} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: SUB0.ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {currentName}
        </span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          style={{
            flexShrink: 0,
            opacity: 0.5,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .2s',
          }}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 220,
            background: SUB0.panel,
            border: `1px solid ${SUB0.line}`,
            borderRadius: 10,
            boxShadow: '0 16px 40px -16px rgba(10,10,10,.15)',
            padding: 6,
            zIndex: 70,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: mono,
              color: SUB0.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '8px 10px 4px',
            }}
          >
            {t('Проекты', 'Projects')}
          </div>
          <DropdownItem
            active={project === 'all'}
            onClick={() => {
              setProject('all');
              setOpen(false);
            }}
            marker={<ProjectMarker color={ALL_COLOR} aggregate size={22} />}
            label={t('Все проекты', 'All projects')}
          />
          {projects.map((p) => (
            <DropdownItem
              key={p.id}
              active={project === p.id}
              onClick={() => {
                setProject(p.id);
                setOpen(false);
              }}
              marker={<ProjectMarker color={p.color} size={22} />}
              label={p.name}
            />
          ))}
          <div style={{ borderTop: `1px solid ${SUB0.line}`, margin: '6px 0' }} />
          <button
            onClick={() => openModal(true)}
            style={ghostBtn}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `1px dashed ${SUB0.muted}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: SUB0.muted,
                fontSize: 16,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              +
            </span>
            {t('Новый проект', 'New project')}
          </button>
          {projects.length > 0 && (
            <button onClick={() => openModal(false)} style={ghostBtn}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: SUB0.soft,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: SUB0.muted,
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ⚙
              </span>
              {t('Управление проектами', 'Manage projects')}
            </button>
          )}
        </div>
      )}

      <ProjectsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        focusCreate={focusCreate}
        onCreated={(p) => setProject(p.id)}
        onDeleted={(id) => {
          if (project === id) setProject('all');
        }}
      />
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '9px 10px',
  borderRadius: 6,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  color: SUB0.muted,
  fontSize: 13,
};

function DropdownItem({
  active,
  onClick,
  marker,
  label,
}: {
  active: boolean;
  onClick: () => void;
  marker: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 10px',
        borderRadius: 6,
        background: active ? SUB0.soft : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      {marker}
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: SUB0.ink }}>{label}</span>
      {active && (
        <span style={{ color: SUB0.blue, fontFamily: mono, fontWeight: 700 }}>✓</span>
      )}
    </button>
  );
}

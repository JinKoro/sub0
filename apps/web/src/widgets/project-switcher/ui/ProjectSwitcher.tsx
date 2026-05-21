'use client';

import { useEffect, useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { ProjectMarker } from '@/shared/components/ui/ProjectMarker';
import { PROJECTS } from '@/entities/project/model/data';

interface Props {
  isMobile?: boolean;
}

export function ProjectSwitcher({ isMobile = false }: Props) {
  const { t } = useLang();
  const { project, setProject } = useCabinet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const current = PROJECTS.find((p) => p.id === project) ?? PROJECTS[0]!;

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
        <ProjectMarker color={current.color} aggregate={current.id === 'all'} size={20} />
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
          {t(current.name, current.nameEn)}
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
            minWidth: 200,
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
          {PROJECTS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProject(p.id);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '9px 10px',
                borderRadius: 6,
                background: project === p.id ? SUB0.soft : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <ProjectMarker color={p.color} aggregate={p.id === 'all'} size={22} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: SUB0.ink }}>
                {t(p.name, p.nameEn)}
              </span>
              {project === p.id && (
                <span style={{ color: SUB0.blue, fontFamily: mono, fontWeight: 700 }}>✓</span>
              )}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${SUB0.line}`, margin: '6px 0' }} />
          <button
            style={{
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
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                border: `1px dashed ${SUB0.muted}`,
                flexShrink: 0,
              }}
            />
            {t('Новый проект', 'New project')}
          </button>
        </div>
      )}
    </div>
  );
}

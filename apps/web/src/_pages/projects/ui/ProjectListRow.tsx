'use client';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import type { ProjectDto } from '@/shared/api/project';
import { pluralizeSubs } from '../lib/pluralize';

interface Props {
  project: ProjectDto;
  last: boolean;
}

export function ProjectListRow({ project, last }: Props) {
  const { lang } = useLang();
  const isMobile = useIsMobile();
  const label = project.name;
  const initial = (label || '?').slice(0, 1).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: isMobile ? '14px 16px' : '14px 24px',
        borderBottom: last ? 'none' : `1px solid ${SUB0.line2}`,
        cursor: 'pointer',
        transition: 'background .12s',
        fontSize: 14,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = SUB0.bg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: project.color || SUB0.muted,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '-0.02em',
            flexShrink: 0,
          }}
        >
          {initial}
        </span>
        <div
          style={{
            minWidth: 0,
            fontWeight: 600,
            color: SUB0.ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      </div>
      {!isMobile && (
        <div style={{ flex: 1, minWidth: 0, color: SUB0.muted, fontSize: 13, fontFamily: mono }}>
          {pluralizeSubs(project.subscriptionsCount, lang)}
        </div>
      )}
      {isMobile && (
        <div
          style={{
            color: SUB0.muted,
            fontSize: 12,
            fontFamily: mono,
            flexShrink: 0,
          }}
        >
          {pluralizeSubs(project.subscriptionsCount, lang)}
        </div>
      )}
      <div
        style={{
          width: 16,
          flexShrink: 0,
          textAlign: 'right',
          color: SUB0.muted,
          fontSize: 16,
        }}
      >
        ›
      </div>
    </div>
  );
}

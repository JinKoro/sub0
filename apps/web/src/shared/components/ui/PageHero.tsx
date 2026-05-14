'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  breadcrumbs: Crumb[];
  title: ReactNode;
  description?: ReactNode;
  titleMaxWidth?: number;
  descriptionMaxWidth?: number;
  /** Reduce bottom padding when the next section is an interactive control (e.g. pricing toggle). */
  compactBottom?: boolean;
}

export function PageHero({
  breadcrumbs,
  title,
  description,
  titleMaxWidth = 820,
  descriptionMaxWidth = 600,
  compactBottom = false,
}: Props) {
  const isMobile = useIsMobile();
  const bottomPad = compactBottom ? (isMobile ? 16 : 24) : isMobile ? 24 : 56;

  return (
    <section
      id="top"
      style={{
        background: SUB0.bg,
        padding: isMobile ? '24px 20px 0' : '40px 48px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `linear-gradient(${SUB0.line} 1px,transparent 1px),linear-gradient(90deg,${SUB0.line} 1px,transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black 10%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 10%, transparent 65%)',
          opacity: 0.5,
        }}
      />
      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: mono,
            fontSize: 12,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: SUB0.muted,
            paddingBottom: isMobile ? 24 : 36,
            flexWrap: 'wrap',
          }}
        >
          {breadcrumbs.map((crumb, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <span
                key={i}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
              >
                {crumb.href && !last ? (
                  <Link
                    href={crumb.href}
                    className="s-a"
                    style={{ color: SUB0.muted, textDecoration: 'none' }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{ color: last ? SUB0.ink : SUB0.muted, fontWeight: last ? 600 : 400 }}>
                    {crumb.label}
                  </span>
                )}
                {!last && <span style={{ opacity: 0.5 }}>/</span>}
              </span>
            );
          })}
        </nav>

        <div style={{ paddingBottom: bottomPad }}>
          <h1
            style={{
              fontSize: isMobile ? 40 : 64,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              margin: '0 0 20px',
              color: SUB0.ink,
              maxWidth: titleMaxWidth,
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                fontSize: isMobile ? 16 : 19,
                lineHeight: 1.55,
                color: '#444',
                maxWidth: descriptionMaxWidth,
                margin: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

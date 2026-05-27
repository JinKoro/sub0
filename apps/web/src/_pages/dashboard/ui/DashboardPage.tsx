'use client';

import { useMemo } from 'react';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { useSubscriptions } from '@/shared/contexts/subscriptions-context';
import { useProjects } from '@/shared/contexts/projects-context';
import { usePlanLimit } from '@/entities/customer/model/use-plan-limit';
import { PlanLimitBanner } from '@/entities/customer/ui/PlanLimitBanner';
import { CabinetCtaButton } from '@/shared/components/ui/CabinetCtaButton';
import { Card } from '@/shared/components/ui/Card';
import { KpiRow } from './KpiRow';
import { UpcomingChargesCard } from './UpcomingChargesCard';
import { TrialsPromosCard } from './TrialsPromosCard';
import { CategoriesDonut } from './CategoriesDonut';
import { MiniCalendar } from './MiniCalendar';

export function DashboardPage() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const { project } = useCabinet();
  const { items, loading, error, refresh } = useSubscriptions();
  const { projects } = useProjects();
  const planLimit = usePlanLimit('subscriptions');

  const filtered = useMemo(() => {
    if (project === 'all') return items;
    const p = projects.find((x) => x.sku === project);
    if (!p) return items;
    return items.filter((s) => s.projectSku === p.sku);
  }, [items, project, projects]);

  return (
    <div
      style={{
        padding: isMobile ? '20px 16px' : '32px 28px',
        maxWidth: 1320,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
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
            {t('Аналитика', 'Analytics')}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 28 : 36,
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            {t('Обзор', 'Overview')}
          </h1>
        </div>
        <CabinetCtaButton
          href="/account/subscriptions/new"
          disabled={planLimit.reached}
          title={
            planLimit.reached
              ? t('Достигнут лимит Free', 'Free tier limit reached')
              : undefined
          }
        >
          + {t('Новая подписка', 'New subscription')}
        </CabinetCtaButton>
      </div>

      <PlanLimitBanner limit={planLimit} />

      {loading && items.length === 0 ? (
        <DashboardSkeleton />
      ) : error ? (
        <DashboardError message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <DashboardEmpty />
      ) : (
        <>
          <KpiRow subs={filtered} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
              gap: 14,
              marginBottom: 16,
            }}
          >
            <UpcomingChargesCard subs={filtered} />
            <TrialsPromosCard subs={filtered} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
              gap: 14,
            }}
          >
            <CategoriesDonut subs={filtered} />
            <MiniCalendar subs={filtered} />
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} height={84} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <SkeletonBox height={320} />
        <SkeletonBox height={320} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <SkeletonBox height={260} />
        <SkeletonBox height={260} />
      </div>
    </div>
  );
}

function SkeletonBox({ height }: { height: number }) {
  return (
    <div
      style={{
        height,
        background: SUB0.soft,
        border: `1px solid ${SUB0.line2}`,
        borderRadius: 10,
        animation: 'sub0-pulse 1.4s ease-in-out infinite',
      }}
    >
      <style>{`@keyframes sub0-pulse{0%,100%{opacity:.65}50%{opacity:.95}}`}</style>
    </div>
  );
}

function DashboardEmpty() {
  const { t } = useLang();
  return (
    <Card padding={48}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 42, lineHeight: 1 }}>📋</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {t('Подписок пока нет', 'No subscriptions yet')}
        </h2>
        <p style={{ margin: 0, color: SUB0.muted, fontSize: 14, maxWidth: 420 }}>
          {t(
            'Добавьте первую подписку, чтобы видеть KPI, ближайшие списания и аналитику.',
            'Add your first subscription to see KPIs, upcoming charges and analytics.',
          )}
        </p>
        <CabinetCtaButton href="/account/subscriptions/new">
          + {t('Добавить подписку', 'Add subscription')}
        </CabinetCtaButton>
      </div>
    </Card>
  );
}

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLang();
  return (
    <Card padding={32}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: SUB0.danger, fontWeight: 600 }}>
          {t('Не удалось загрузить подписки', 'Failed to load subscriptions')}
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 12,
            color: SUB0.muted,
            wordBreak: 'break-word',
            maxWidth: 480,
            textAlign: 'center',
          }}
        >
          {message}
        </div>
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            background: SUB0.ink,
            color: SUB0.bg,
            border: 0,
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {t('Повторить', 'Retry')}
        </button>
      </div>
    </Card>
  );
}

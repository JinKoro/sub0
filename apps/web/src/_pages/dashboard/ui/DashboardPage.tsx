'use client';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { CabinetCtaButton } from '@/shared/components/ui/CabinetCtaButton';
import { CAB_SUBS } from '@/entities/subscription/model/cabinet-mock';
import { KpiRow } from './KpiRow';
import { UpcomingChargesCard } from './UpcomingChargesCard';
import { TrialsPromosCard } from './TrialsPromosCard';
import { CategoriesDonut } from './CategoriesDonut';
import { MiniCalendar } from './MiniCalendar';

export function DashboardPage() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const { project } = useCabinet();

  const filtered = project === 'all' ? CAB_SUBS : CAB_SUBS.filter((s) => s.project === project);

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
        <CabinetCtaButton href="/subscriptions?new=1">
          + {t('Новая подписка', 'New subscription')}
        </CabinetCtaButton>
      </div>

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
    </div>
  );
}

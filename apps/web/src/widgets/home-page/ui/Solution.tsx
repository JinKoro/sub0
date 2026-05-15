'use client';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Section } from '@/shared/components/ui/Section';
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow';
import { H2 } from '@/shared/components/ui/H2';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { SUBS } from '@/entities/subscription/model/data';
import { fmtRub } from '@/shared/lib/format';

type VisualKind = 'list' | 'bell' | 'chart' | 'projects';

function MiniVisual({ kind, t }: { kind: VisualKind; t: (ru: string, en: string) => string }) {
  const box = {
    background: SUB0.bg,
    border: `1px solid ${SUB0.line}`,
    borderRadius: 8,
    height: 148,
    padding: 14,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  };

  if (kind === 'list') {
    return (
      <div style={box}>
        {SUBS.slice(0, 4).map((r) => (
          <div
            key={r.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              padding: '6px 8px',
              background: SUB0.panel,
              borderRadius: 4,
            }}
          >
            <LogoPill char={r.char} color={r.color} icon={r.icon} size={16} />
            <span style={{ fontWeight: 600, flex: 1 }}>{r.name}</span>
            <span style={{ fontFamily: mono, color: SUB0.muted }}>{fmtRub(r.price)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === 'bell') {
    return (
      <div style={{ ...box, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: SUB0.blue,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 0 0 6px rgba(19,71,255,.15)',
          }}
        >
          !
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>СберПрайм</div>
          <div style={{ fontSize: 10, color: SUB0.muted, fontFamily: mono }}>
            {t('списание через 3 дня', 'renews in 3 days')}
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'chart') {
    const bars = [40, 62, 48, 78, 55, 90, 72];
    return (
      <div style={{ ...box, flexDirection: 'row', alignItems: 'flex-end', gap: 6, padding: 14 }}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background: i === 5 ? SUB0.blue : SUB0.ink,
              opacity: i === 5 ? 1 : 0.15,
              borderRadius: '4px 4px 0 0',
            }}
          />
        ))}
      </div>
    );
  }

  const projects = [
    { ruName: 'Личное', enName: 'Personal', count: 12, color: SUB0.ink, active: true },
    { ruName: 'Студия', enName: 'Studio', count: 8, color: SUB0.blue, active: false },
    { ruName: 'Агентство', enName: 'Agency', count: 17, color: '#0a7a3f', active: false },
  ];
  return (
    <div style={{ ...box, gap: 6, justifyContent: 'center' }}>
      {projects.map((p) => (
        <div
          key={p.ruName}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 9px',
            background: SUB0.panel,
            border: `1px solid ${p.active ? SUB0.ink : SUB0.line}`,
            borderRadius: 5,
            fontSize: 11,
          }}
        >
          <div
            style={{
              width: 14,
              height: 11,
              borderRadius: 2,
              background: p.color,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -3,
                left: 0,
                width: 6,
                height: 3,
                background: p.color,
                borderRadius: '2px 2px 0 0',
              }}
            />
          </div>
          <span style={{ fontWeight: 600, flex: 1 }}>{t(p.ruName, p.enName)}</span>
          <span style={{ fontFamily: mono, color: SUB0.muted }}>{p.count}</span>
        </div>
      ))}
      <div
        style={{
          textAlign: 'center',
          fontSize: 10,
          color: SUB0.muted,
          fontFamily: mono,
          marginTop: 2,
          letterSpacing: '0.04em',
        }}
      >
        {t('+ новый проект', '+ new project')}
      </div>
    </div>
  );
}

const ITEMS: Array<{
  num: string;
  ru: string;
  en: string;
  subRu: string;
  subEn: string;
  visual: VisualKind;
}> = [
  {
    num: '01',
    ru: 'Все подписки в одном месте',
    en: 'Every subscription in one place',
    subRu: 'Один список. Сортировки, фильтры, категории. Видно, когда платите и за что.',
    subEn: 'One list. Sort, filter, categorise. See what you pay for — and why.',
    visual: 'list',
  },
  {
    num: '02',
    ru: 'Напоминания до списания',
    en: 'Reminders before renewal',
    subRu: 'Гибко настраивайте уведомления о списании. Успейте отменить подписку или передумать.',
    subEn: '3 days before renewal — push or email. Time to keep or kill it.',
    visual: 'bell',
  },
  {
    num: '03',
    ru: 'Аналитика расходов',
    en: 'Spend analytics',
    subRu: 'Графики по месяцам и категориям. Прогноз на год с календарем расходов.',
    subEn: 'Charts by month and category. Yearly forecast plus your priciest service.',
    visual: 'chart',
  },
  {
    num: '04',
    ru: 'Проекты для подписок',
    en: 'Projects for subscriptions',
    subRu: 'Несколько бизнесов или общий тариф Team — каждому свой проект.',
    subEn:
      'Several businesses or a shared Team plan — one project each. Free plan includes one project.',
    visual: 'projects',
  },
];

export function Solution() {
  const { t } = useLang();
  const isMobile = useIsMobile();

  return (
    <Section bg={SUB0.panel} pad={isMobile ? '64px 20px' : '120px 48px'}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 48,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <SectionEyebrow num="04">{t('Решение', 'The solution')}</SectionEyebrow>
          <H2 accent={t('полный контроль.', 'full control.')}>
            {t('Один сервис —', 'One service —')}
          </H2>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: 16,
          marginTop: 48,
        }}
      >
        {ITEMS.map((it) => (
          <div
            key={it.num}
            className="s-card"
            style={{
              border: `1px solid ${SUB0.line}`,
              borderRadius: 12,
              padding: 0,
              overflow: 'hidden',
              background: SUB0.panel,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '22px 22px 0' }}>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: SUB0.blue,
                  letterSpacing: '0.1em',
                  marginBottom: 14,
                }}
              >
                {it.num}
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  marginBottom: 10,
                }}
              >
                {t(it.ru, it.en)}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: '#555', marginBottom: 18 }}>
                {t(it.subRu, it.subEn)}
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 160, padding: '0 18px 18px' }}>
              <MiniVisual kind={it.visual} t={t} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

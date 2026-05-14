'use client';

import { useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { LogoPill } from '@/shared/components/ui/LogoPill';

interface DetectedItem {
  id: number;
  char: string;
  color: string;
  name: string;
  price: number;
  cur: string;
  cycle: 'monthly' | 'yearly';
  picked: boolean;
}

const MOCK_DETECTED: DetectedItem[] = [
  { id: 1, char: 'N', color: '#c94a1c', name: 'Netflix', price: 799, cur: 'RUB', cycle: 'monthly', picked: true },
  { id: 2, char: 'S', color: '#0a7a3f', name: 'Spotify', price: 299, cur: 'RUB', cycle: 'monthly', picked: true },
  { id: 3, char: 'C', color: '#0a7a3f', name: 'ChatGPT Plus', price: 20, cur: 'USD', cycle: 'monthly', picked: true },
  { id: 4, char: 'i', color: '#6b6b66', name: 'iCloud+', price: 149, cur: 'RUB', cycle: 'monthly', picked: true },
  { id: 5, char: 'D', color: '#1347ff', name: 'Dropbox', price: 119, cur: 'USD', cycle: 'yearly', picked: false },
  { id: 6, char: '?', color: '#6b6b66', name: 'Cloudflare ($5)', price: 5, cur: 'USD', cycle: 'monthly', picked: false },
];

interface HintProps {
  title: string;
  body: string;
}

function Hint({ title, body }: HintProps) {
  return (
    <div
      style={{
        padding: 14,
        background: SUB0.bg,
        border: `1px solid ${SUB0.line2}`,
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: SUB0.muted, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

export function FileUploadView() {
  const { t } = useLang();
  const [stage, setStage] = useState<'upload' | 'parsing' | 'review'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<DetectedItem[]>(MOCK_DETECTED);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onChoose = (f: File) => {
    setFile(f);
    setStage('parsing');
    setTimeout(() => setStage('review'), 1800);
  };

  const toggle = (id: number) =>
    setItems((arr) => arr.map((x) => (x.id === id ? { ...x, picked: !x.picked } : x)));

  const reset = () => {
    setFile(null);
    setStage('upload');
    setItems(MOCK_DETECTED);
  };

  const pickedCount = items.filter((x) => x.picked).length;

  const btnPrimary = {
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    background: SUB0.ink,
    color: SUB0.bg,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as const;
  const btnSecondary = {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${SUB0.line}`,
    background: SUB0.panel,
    color: SUB0.ink,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as const;

  if (stage === 'review') {
    return (
      <div>
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${SUB0.line}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: SUB0.soft,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: SUB0.muted,
                fontFamily: mono,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              ✓
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {t(`Найдено ${items.length} подписок`, `${items.length} subscriptions detected`)}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: SUB0.muted,
                  fontFamily: mono,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file?.name ?? 'statement.pdf'}
              </div>
            </div>
          </div>
          <button onClick={reset} style={btnSecondary}>
            {t('Загрузить другой файл', 'Use another file')}
          </button>
        </div>

        <div>
          {items.map((it) => (
            <label
              key={it.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 24px',
                cursor: 'pointer',
                borderBottom: `1px solid ${SUB0.line2}`,
              }}
            >
              <input
                type="checkbox"
                checked={it.picked}
                onChange={() => toggle(it.id)}
                style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
              />
              <LogoPill char={it.char} color={it.color} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 11, color: SUB0.muted, fontFamily: mono }}>
                  {it.cycle === 'monthly' ? t('ежемесячно', 'monthly') : t('ежегодно', 'yearly')}
                </div>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontFamily: mono,
                  fontFeatureSettings: '"tnum"',
                  textAlign: 'right',
                }}
              >
                {it.price} {it.cur}
              </div>
            </label>
          ))}
        </div>

        <div
          style={{
            padding: '14px 24px',
            borderTop: `1px solid ${SUB0.line}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: SUB0.panel,
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono }}>
            {t(
              `Импортируем ${pickedCount} из ${items.length}`,
              `Importing ${pickedCount} of ${items.length}`,
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={btnSecondary}>
              {t('Отмена', 'Cancel')}
            </button>
            <button
              style={btnPrimary}
              disabled={pickedCount === 0}
              onClick={reset}
            >
              {t(`Импортировать ${pickedCount}`, `Import ${pickedCount}`)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        onClick={() => stage === 'upload' && fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) onChoose(f);
        }}
        style={{
          border: `2px dashed ${stage === 'parsing' ? SUB0.blue : SUB0.line}`,
          borderRadius: 14,
          padding: '48px 24px',
          textAlign: 'center',
          background: stage === 'parsing' ? `${SUB0.blue}08` : SUB0.panel,
          cursor: stage === 'upload' ? 'pointer' : 'default',
          transition: 'background .2s, border-color .2s',
        }}
      >
        {stage === 'upload' ? (
          <>
            <div
              style={{
                fontSize: 36,
                marginBottom: 12,
                color: SUB0.muted,
                lineHeight: 1,
              }}
            >
              ↑
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
              {t('Перетащите файл или нажмите', 'Drag a file or click')}
            </div>
            <div
              style={{
                fontSize: 12,
                color: SUB0.muted,
                fontFamily: mono,
                marginBottom: 16,
              }}
            >
              CSV · XLSX · PDF · JPG · PNG
            </div>
            <button style={btnPrimary}>{t('Выбрать файл', 'Choose file')}</button>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onChoose(f);
              }}
            />
          </>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: SUB0.blue,
                  animation: 's-pulse 1.2s infinite',
                }}
              />
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  color: SUB0.blue,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                {t('AI распознаёт подписки…', 'AI is parsing your file…')}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{file?.name}</div>
            <div
              style={{
                fontSize: 12,
                color: SUB0.muted,
                fontFamily: mono,
                marginTop: 4,
              }}
            >
              {t('Это занимает 5–10 секунд', 'This takes 5–10 seconds')}
            </div>
          </>
        )}
      </div>

      <div
        style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
        }}
      >
        <Hint
          title={t('Банковские выписки', 'Bank statements')}
          body={t(
            'Загрузите PDF выписки за месяц — AI найдёт регулярные списания.',
            'Drop a PDF — AI will detect recurring charges.',
          )}
        />
        <Hint
          title={t('Таблицы и CSV', 'Spreadsheets & CSV')}
          body={t(
            'Колонки: название, цена, валюта, цикл. AI разберёт даже криво названные.',
            'Columns: name, price, currency, cycle. Messy headers OK.',
          )}
        />
        <Hint
          title={t('Скриншоты и чеки', 'Screenshots & receipts')}
          body={t(
            'OCR + AI определят сервис, сумму и валюту с фото.',
            'OCR + AI detect the service, amount, and currency from a photo.',
          )}
        />
      </div>
    </div>
  );
}

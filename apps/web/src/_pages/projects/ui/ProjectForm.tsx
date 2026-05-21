'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { ApiError } from '@/shared/api/client';
import type { ProjectDto } from '@/shared/api/project';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { randomProjectHex } from '../lib/random-color';

interface Props {
  initial?: ProjectDto;
  onSave: (name: string, color: string, version: number) => Promise<ProjectDto | void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

const pBtnPri: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  background: SUB0.ink,
  color: SUB0.bg,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const pBtnSec: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: `1px solid ${SUB0.line}`,
  background: SUB0.panel,
  color: SUB0.ink,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export function ProjectForm({ initial, onSave, onCancel, onDelete }: Props) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [name, setName] = useState(initial ? initial.name : '');
  const [color, setColor] = useState(initial ? initial.color : randomProjectHex());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = name.trim();
  // Edit: disable Save when nothing actually changed (avoids a no-op POST that
  // just bumps `version`). Create: any non-empty name is savable.
  const dirty = !initial || trimmed !== initial.name || color !== initial.color;
  const canSave = trimmed.length > 0 && dirty && !busy;
  const initialChar = (trimmed || '?').slice(0, 1).toUpperCase();

  const shuffle = () => setColor((c) => randomProjectHex(c));

  const doSave = async () => {
    if (!canSave) return;
    setBusy(true);
    setErr(null);
    try {
      await onSave(trimmed, color, initial?.version ?? 1);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setErr(
          t(
            'Проект изменён в другой вкладке — обновите страницу',
            'Project changed elsewhere — reload the page',
          ),
        );
      } else {
        setErr(t('Не удалось сохранить', 'Save failed'));
      }
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!onDelete) return;
    setDeleteBusy(true);
    setErr(null);
    try {
      await onDelete();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        setErr(t('Нельзя удалить единственный проект', 'Cannot delete the only project'));
      } else {
        setErr(t('Не удалось удалить', 'Delete failed'));
      }
      setDeleteBusy(false);
      setConfirming(false);
    }
  };

  const fld: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
  const lbl: CSSProperties = {
    fontSize: 11,
    fontFamily: mono,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: SUB0.muted,
  };
  const inp: CSSProperties = {
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${SUB0.line}`,
    background: SUB0.panel,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    color: SUB0.ink,
  };

  return (
    <div>
      {/* Header preview */}
      <div
        style={{
          padding: isMobile ? '16px 16px 8px' : '20px 24px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: color,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 19,
            flexShrink: 0,
            transition: 'background .2s',
          }}
        >
          {initialChar}
        </span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: SUB0.ink }}>
            {trimmed || t('Без названия', 'Untitled')}
          </div>
          <div style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono }}>
            {color.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Fields */}
      <div
        style={{
          padding: isMobile ? '14px 16px 20px' : '16px 24px 24px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)',
          gap: 14,
        }}
      >
        <div style={{ ...fld, gridColumn: '1 / -1' }}>
          <label style={lbl}>{t('Название', 'Name')}</label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSave) void doSave();
              if (e.key === 'Escape') onCancel();
            }}
            style={inp}
            placeholder={t(
              'Например: Личные, Семейные, Работа',
              'e.g. Personal, Family, Work',
            )}
            disabled={busy}
          />
        </div>

        <div style={{ ...fld, gridColumn: '1 / -1' }}>
          <label style={lbl}>{t('Цвет ярлыка', 'Label color')}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <div
              style={{
                ...inp,
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: color,
                  flexShrink: 0,
                  transition: 'background .2s',
                }}
              />
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 14,
                  fontWeight: 600,
                  color: SUB0.ink,
                  letterSpacing: '0.02em',
                }}
              >
                {color.toUpperCase()}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontFamily: mono,
                  color: SUB0.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                HEX
              </span>
            </div>
            <button
              type="button"
              onClick={shuffle}
              disabled={busy}
              title={t('Сгенерировать цвет', 'Generate color')}
              style={{
                padding: '0 14px',
                borderRadius: 8,
                border: `1px solid ${SUB0.line}`,
                background: SUB0.panel,
                color: SUB0.ink,
                cursor: busy ? 'default' : 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = SUB0.ink)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = SUB0.line)}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11 2l2.5 2.5L11 7M13.2 4.5H7.5c-2 0-3.5 1.5-3.5 3.5M5 14l-2.5-2.5L5 9M2.8 11.5h5.7c2 0 3.5-1.5 3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t('Сгенерировать', 'Shuffle')}
            </button>
          </div>
        </div>
      </div>

      {err && (
        <div
          style={{
            padding: isMobile ? '0 16px 12px' : '0 24px 14px',
            fontSize: 13,
            color: '#9a3b12',
          }}
        >
          {err}
        </div>
      )}

      {/* Footer actions */}
      <div
        style={{
          padding: isMobile ? '12px 16px' : '14px 24px',
          borderTop: `1px solid ${SUB0.line}`,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          background: SUB0.panel,
          flexWrap: 'wrap',
        }}
      >
        {initial && onDelete ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={busy}
            style={{ ...pBtnSec, color: SUB0.danger, borderColor: '#f3d6c2' }}
          >
            {t('Удалить', 'Delete')}
          </button>
        ) : (
          <span />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} disabled={busy} style={pBtnSec}>
            {t('Отмена', 'Cancel')}
          </button>
          <button
            onClick={() => void doSave()}
            disabled={!canSave}
            style={{
              ...pBtnPri,
              opacity: canSave ? 1 : 0.4,
              cursor: canSave ? 'pointer' : 'not-allowed',
            }}
          >
            {busy
              ? t('Сохраняем…', 'Saving…')
              : initial
                ? t('Сохранить', 'Save')
                : t('Создать', 'Create')}
          </button>
        </div>
      </div>

      {initial && onDelete && (
        <ConfirmDialog
          open={confirming}
          busy={deleteBusy}
          destructive
          title={t(
            `Удалить проект «${initial.name}»?`,
            `Delete project “${initial.name}”?`,
          )}
          description={t(
            'Все подписки проекта будут безвозвратно удалены.',
            'All subscriptions in the project will be permanently deleted.',
          )}
          confirmLabel={deleteBusy ? t('Удаляем…', 'Deleting…') : t('Удалить', 'Delete')}
          cancelLabel={t('Отмена', 'Cancel')}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void doDelete()}
        />
      )}
    </div>
  );
}

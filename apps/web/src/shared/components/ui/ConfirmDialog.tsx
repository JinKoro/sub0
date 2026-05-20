'use client';

import { useEffect } from 'react';
import { SUB0 } from '@/shared/constants/tokens';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Branded confirm dialog used in danger zones instead of window.confirm (#73). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={() => !busy && onCancel()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 200,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: SUB0.panel,
          borderRadius: 14,
          border: `1px solid ${SUB0.line}`,
          boxShadow: '0 30px 80px -20px rgba(10, 10, 10, 0.35)',
          padding: '24px 24px 20px',
        }}
      >
        <h2
          id="confirm-dialog-title"
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: SUB0.ink,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: 14,
              color: SUB0.muted,
              lineHeight: 1.55,
              margin: '10px 0 0',
            }}
          >
            {description}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 22,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '10px 16px',
              borderRadius: 9,
              border: `1px solid ${SUB0.line}`,
              background: SUB0.panel,
              color: SUB0.ink,
              fontSize: 14,
              fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{
              padding: '10px 18px',
              borderRadius: 9,
              border: 'none',
              background: destructive ? SUB0.danger : SUB0.ink,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              fontFamily: 'inherit',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

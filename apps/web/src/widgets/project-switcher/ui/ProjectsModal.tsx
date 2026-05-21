'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SUB0 } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useProjects } from '@/shared/contexts/projects-context';
import { ApiError } from '@/shared/api/client';
import type { ProjectDto } from '@/shared/api/project';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { ProjectMarker } from '@/shared/components/ui/ProjectMarker';

interface Props {
  open: boolean;
  onClose: () => void;
  /** id of the project to focus on opening (e.g. coming from the switcher). */
  focusCreate?: boolean;
  /** Called after a successful create; switcher uses it to switch to the new project. */
  onCreated?: (p: ProjectDto) => void;
  /** Called after a successful delete; switcher uses it to fall back to 'all'. */
  onDeleted?: (id: string) => void;
}

export function ProjectsModal({ open, onClose, focusCreate, onCreated, onDeleted }: Props) {
  const { t } = useLang();
  const { projects, create, rename, remove } = useProjects();

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement | null>(null);

  // Per-project edit buffer + busy flags. Reset every time the modal opens.
  const [nameBuf, setNameBuf] = useState<Record<string, string>>({});
  const [renameBusy, setRenameBusy] = useState<Record<string, boolean>>({});
  const [rowErr, setRowErr] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<ProjectDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNameBuf(Object.fromEntries(projects.map((p) => [p.id, p.name])));
    setRowErr({});
    setCreateErr(null);
    setNewName('');
    if (focusCreate) {
      requestAnimationFrame(() => newInputRef.current?.focus());
    }
  }, [open, projects, focusCreate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !creating && !deleteBusy) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, creating, deleteBusy, onClose]);

  if (!open) return null;

  const onCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setCreateErr(null);
    try {
      const p = await create(name);
      setNewName('');
      onCreated?.(p);
    } catch {
      setCreateErr(t('Не удалось создать проект', 'Could not create project'));
    } finally {
      setCreating(false);
    }
  };

  const onRename = async (p: ProjectDto) => {
    const next = (nameBuf[p.id] ?? '').trim();
    if (!next || next === p.name) return;
    setRenameBusy((s) => ({ ...s, [p.id]: true }));
    setRowErr((s) => ({ ...s, [p.id]: '' }));
    try {
      await rename(p.id, next, p.version);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setRowErr((s) => ({
          ...s,
          [p.id]: t('Изменено в другой вкладке — перезагрузите', 'Changed elsewhere — reload'),
        }));
      } else {
        setRowErr((s) => ({ ...s, [p.id]: t('Не удалось сохранить', 'Save failed') }));
      }
    } finally {
      setRenameBusy((s) => ({ ...s, [p.id]: false }));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    try {
      const id = pendingDelete.id;
      await remove(id);
      setPendingDelete(null);
      onDeleted?.(id);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        setRowErr((s) => ({
          ...s,
          [pendingDelete.id]: t(
            'Нельзя удалить единственный проект',
            'Cannot delete the only project',
          ),
        }));
      } else {
        setRowErr((s) => ({
          ...s,
          [pendingDelete.id]: t('Не удалось удалить', 'Delete failed'),
        }));
      }
      setPendingDelete(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const backdrop: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10, 10, 10, 0.45)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 16,
    paddingTop: 72,
    zIndex: 180,
    backdropFilter: 'blur(2px)',
  };

  const dialog: CSSProperties = {
    width: '100%',
    maxWidth: 520,
    background: SUB0.panel,
    borderRadius: 14,
    border: `1px solid ${SUB0.line}`,
    boxShadow: '0 30px 80px -20px rgba(10, 10, 10, 0.35)',
    overflow: 'hidden',
  };

  const sectionLabel: CSSProperties = {
    fontSize: 11,
    color: SUB0.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  };

  const inp: CSSProperties = {
    flex: 1,
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${SUB0.line}`,
    background: SUB0.panel,
    fontSize: 14,
    fontFamily: 'inherit',
    color: SUB0.ink,
    outline: 'none',
    minWidth: 0,
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="projects-modal-title"
        onClick={() => !creating && !deleteBusy && onClose()}
        style={backdrop}
      >
        <div onClick={(e) => e.stopPropagation()} style={dialog}>
          {/* Header */}
          <div
            style={{
              padding: '18px 22px',
              borderBottom: `1px solid ${SUB0.line2}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <h2
              id="projects-modal-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: SUB0.ink,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {t('Проекты', 'Projects')}
            </h2>
            <button
              onClick={onClose}
              disabled={creating || deleteBusy}
              aria-label={t('Закрыть', 'Close')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: creating || deleteBusy ? 'default' : 'pointer',
                color: SUB0.muted,
                fontSize: 22,
                lineHeight: 1,
                padding: 4,
              }}
            >
              ×
            </button>
          </div>

          {/* Create */}
          <div
            style={{
              padding: '16px 22px 18px',
              borderBottom: `1px solid ${SUB0.line2}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={sectionLabel}>{t('Новый проект', 'New project')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={newInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onCreate();
                }}
                placeholder={t('Например, «Семья»', 'For example, “Family”')}
                disabled={creating}
                maxLength={255}
                style={inp}
              />
              <button
                onClick={() => void onCreate()}
                disabled={creating || newName.trim().length === 0}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: SUB0.ink,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: creating || newName.trim().length === 0 ? 'default' : 'pointer',
                  opacity: creating || newName.trim().length === 0 ? 0.55 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {creating ? t('Создаём…', 'Creating…') : t('Создать', 'Create')}
              </button>
            </div>
            {createErr && (
              <div style={{ fontSize: 12, color: '#9a3b12' }}>{createErr}</div>
            )}
          </div>

          {/* List */}
          <div style={{ padding: '14px 22px 20px', maxHeight: '50vh', overflowY: 'auto' }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>
              {t('Ваши проекты', 'Your projects')}
            </div>
            {projects.length === 0 && (
              <div style={{ fontSize: 13, color: SUB0.muted, padding: '10px 0' }}>
                {t('Пока пусто', 'Empty for now')}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.map((p) => {
                const cur = nameBuf[p.id] ?? p.name;
                const dirty = cur.trim() !== p.name && cur.trim().length > 0;
                const busy = !!renameBusy[p.id];
                const err = rowErr[p.id];
                return (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ProjectMarker color={p.color} size={26} />
                      <input
                        type="text"
                        value={cur}
                        onChange={(e) => setNameBuf((s) => ({ ...s, [p.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && dirty) void onRename(p);
                        }}
                        disabled={busy}
                        maxLength={255}
                        style={inp}
                      />
                      <span style={{ fontSize: 11, color: SUB0.muted, minWidth: 56, textAlign: 'right' }}>
                        {t(
                          `${p.subscriptionsCount} подп.`,
                          `${p.subscriptionsCount} sub${p.subscriptionsCount === 1 ? '' : 's'}`,
                        )}
                      </span>
                      <button
                        onClick={() => void onRename(p)}
                        disabled={!dirty || busy}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          border: `1px solid ${SUB0.line}`,
                          background: SUB0.panel,
                          color: SUB0.ink,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: !dirty || busy ? 'default' : 'pointer',
                          opacity: !dirty || busy ? 0.5 : 1,
                          fontFamily: 'inherit',
                        }}
                      >
                        {busy ? t('…', '…') : t('Сохранить', 'Save')}
                      </button>
                      <button
                        onClick={() => setPendingDelete(p)}
                        disabled={busy}
                        aria-label={t('Удалить', 'Delete')}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 8,
                          border: `1px solid ${SUB0.line}`,
                          background: SUB0.panel,
                          color: SUB0.danger,
                          fontSize: 16,
                          lineHeight: 1,
                          cursor: busy ? 'default' : 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        ×
                      </button>
                    </div>
                    {err && (
                      <div style={{ fontSize: 12, color: '#9a3b12', paddingLeft: 36 }}>{err}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        busy={deleteBusy}
        destructive
        title={t('Удалить проект?', 'Delete project?')}
        description={
          pendingDelete
            ? t(
                `Проект «${pendingDelete.name}» и ${pendingDelete.subscriptionsCount} подписок будут удалены безвозвратно. Восстановить нельзя.`,
                `Project “${pendingDelete.name}” and ${pendingDelete.subscriptionsCount} subscription${pendingDelete.subscriptionsCount === 1 ? '' : 's'} will be permanently deleted. This cannot be undone.`,
              )
            : ''
        }
        confirmLabel={deleteBusy ? t('Удаляем…', 'Deleting…') : t('Удалить', 'Delete')}
        cancelLabel={t('Отмена', 'Cancel')}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}

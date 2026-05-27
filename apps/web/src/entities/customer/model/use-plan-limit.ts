'use client';

import { useMemo } from 'react';
import {
  FREE_TIER_PROJECT_LIMIT,
  FREE_TIER_SUBSCRIPTION_LIMIT,
  Plan,
  SubscriptionState,
} from '@subzero/shared';

import { useProfile } from '@/shared/contexts/profile-context';
import { useProjects } from '@/shared/contexts/projects-context';
import { useSubscriptions } from '@/shared/contexts/subscriptions-context';

export type PlanScope = 'subscriptions' | 'projects';

export interface PlanLimit {
  /** Сколько слотов занято. */
  used: number;
  /** Лимит плана. Для PRO — Infinity. */
  limit: number;
  /** Юзер на FREE — для PRO баннеры и disabled CTA не показываем. */
  isFree: boolean;
  /** used >= limit — нельзя создавать новые. */
  reached: boolean;
  /** Сколько ещё можно завести; для PRO — Infinity. */
  remaining: number;
}

/**
 * План-лимит на клиенте.
 *
 * - `subscriptions`: ARCHIVED не считаем (финальное состояние); soft-deleted
 *   на фронт не приходят. Лимит — FREE_TIER_SUBSCRIPTION_LIMIT.
 * - `projects`: бэк возвращает только активные не-удалённые. Лимит —
 *   FREE_TIER_PROJECT_LIMIT.
 *
 * Бэк — источник истины (см. *Service.create). UI рисует баннеры и
 * disabled-CTA для UX, но не блокирует request.
 */
export function usePlanLimit(scope: PlanScope): PlanLimit {
  const { profile } = useProfile();
  const { items } = useSubscriptions();
  const { projects } = useProjects();

  return useMemo(() => {
    const isFree = profile?.planId === Plan.FREE;
    const used =
      scope === 'subscriptions'
        ? items.reduce((n, s) => (s.stateId === SubscriptionState.ARCHIVED ? n : n + 1), 0)
        : projects.length;
    const freeLimit =
      scope === 'subscriptions' ? FREE_TIER_SUBSCRIPTION_LIMIT : FREE_TIER_PROJECT_LIMIT;
    const limit = isFree ? freeLimit : Number.POSITIVE_INFINITY;
    const reached = used >= limit;
    const remaining = Math.max(0, limit - used);
    return { used, limit, isFree, reached, remaining };
  }, [profile?.planId, items, projects, scope]);
}

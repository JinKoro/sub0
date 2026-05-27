export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly body: unknown = null) {
    super(`API error ${status}`);
  }
}

let refreshing: Promise<boolean> | null = null;

async function refreshAccess(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const r = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return r.ok;
    } catch {
      return false;
    } finally {
      // Сбрасываем после небольшой задержки, чтобы параллельные звонки тоже использовали результат.
      setTimeout(() => {
        refreshing = null;
      }, 0);
    }
  })();
  return refreshing;
}

/**
 * fetch wrapper. `credentials: 'include'` so the backend can set/read the
 * httpOnly auth cookies (sub0_session, refresh_token).
 *
 * On 401 — пробует один раз обновить access-токен через /auth/refresh
 * и повторить запрос. Если refresh не сработал — бросает ApiError(401),
 * вызывающая сторона может перенаправить на login.
 */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });

  let res = await doFetch();
  // Не рекурсимся на сам /auth/refresh.
  if (res.status === 401 && !path.startsWith('/auth/refresh')) {
    const ok = await refreshAccess();
    if (ok) {
      res = await doFetch();
    }
  }
  if (!res.ok) {
    // Парсим тело один раз: вызывающим нужен machine-readable code
    // (например, free_tier_limit_reached). Молча игнорим парс-ошибки —
    // некоторые ответы пустые или не-JSON.
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* пустой/не-JSON ответ */
    }
    throw new ApiError(res.status, body);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

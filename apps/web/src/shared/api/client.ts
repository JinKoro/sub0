export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`API error ${status}`);
  }
}

/**
 * fetch wrapper. `credentials: 'include'` so the backend can set/read the
 * httpOnly auth cookies (sub0_session, refresh_token).
 */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    throw new ApiError(res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

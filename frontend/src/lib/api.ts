const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type RoleName = 'USER' | 'CREATOR' | 'ADMIN';

export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  blocked: boolean;
  roles: RoleName[];
};

function getStoredTokens() {
  if (typeof window === 'undefined') return { access: null as string | null, refresh: null as string | null };
  return {
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken'),
  };
}

export function setStoredTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearStoredTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function refreshAccess(): Promise<string | null> {
  const { refresh } = getStoredTokens();
  if (!refresh) return null;
  const res = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  setStoredTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const { access } = getStoredTokens();
  const headers = new Headers(init.headers);
  if (access) headers.set('Authorization', `Bearer ${access}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (res.status === 401 && retry) {
    const newAccess = await refreshAccess();
    if (newAccess) {
      return apiFetch<T>(path, init, false);
    }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export { API };

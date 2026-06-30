import { getSupabaseAccessToken } from './supabaseAuth';

async function authHeaders(extraHeaders: Record<string, string> = {}) {
  const token = await getSupabaseAccessToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJsonResponse(r: Response) {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string })?.error || 'Request failed');
  return data;
}

export async function fetchApi(url: string) {
  const r = await fetch(url, {
    credentials: 'same-origin' as const,
    headers: await authHeaders({ Accept: 'application/json' }),
  });
  return parseJsonResponse(r);
}

export async function postApi(url: string, body: unknown) {
  const r = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin' as const,
    headers: await authHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
    body: JSON.stringify(body),
  });
  return parseJsonResponse(r);
}

export async function putApi(url: string, body: unknown) {
  const r = await fetch(url, {
    method: 'PUT',
    credentials: 'same-origin' as const,
    headers: await authHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
    body: JSON.stringify(body),
  });
  return parseJsonResponse(r);
}

export async function patchApi(url: string, body: unknown) {
  const r = await fetch(url, {
    method: 'PATCH',
    credentials: 'same-origin' as const,
    headers: await authHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
    body: JSON.stringify(body),
  });
  return parseJsonResponse(r);
}

export async function deleteApi(url: string) {
  return fetch(url, {
    method: 'DELETE',
    credentials: 'same-origin' as const,
    headers: await authHeaders({ Accept: 'application/json' }),
  });
}

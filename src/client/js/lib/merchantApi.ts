export function fetchApi(url: string) {
  return fetch(url, { credentials: 'same-origin' as const }).then((r) => r.json());
}

export function postApi(url: string, body: unknown) {
  return fetch(url, {
    method: 'POST',
    credentials: 'same-origin' as const,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as { error?: string })?.error || 'Request failed');
    return data;
  });
}

export function putApi(url: string, body: unknown) {
  return fetch(url, {
    method: 'PUT',
    credentials: 'same-origin' as const,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as { error?: string })?.error || 'Request failed');
    return data;
  });
}

export function patchApi(url: string, body: unknown) {
  return fetch(url, {
    method: 'PATCH',
    credentials: 'same-origin' as const,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as { error?: string })?.error || 'Request failed');
    return data;
  });
}

export function deleteApi(url: string) {
  return fetch(url, {
    method: 'DELETE',
    credentials: 'same-origin' as const,
    headers: { Accept: 'application/json' },
  });
}

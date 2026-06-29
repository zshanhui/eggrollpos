import { postApi, deleteApi } from './merchantApi';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateMenuItemImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Only JPG, PNG, and WebP images are allowed';
  }
  if (file.size > MAX_BYTES) {
    return 'Image must be 2 MB or smaller';
  }
  return null;
}

export async function uploadMenuItemImage(
  merchantId: number,
  menuItemId: number,
  file: File,
): Promise<string> {
  const validationError = validateMenuItemImageFile(file);
  if (validationError) throw new Error(validationError);

  const presign = await postApi(
    `/api/merchants/${merchantId}/menu-items/${menuItemId}/image/presign`,
    { contentType: file.type, contentLength: file.size },
  );

  const uploadRes = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!uploadRes.ok) {
    throw new Error('Failed to upload image to storage');
  }

  const complete = await postApi(
    `/api/merchants/${merchantId}/menu-items/${menuItemId}/image/complete`,
    { key: presign.key },
  );

  return complete.imageUrl as string;
}

export async function removeMenuItemImage(merchantId: number, menuItemId: number): Promise<void> {
  const res = await deleteApi(`/api/merchants/${merchantId}/menu-items/${menuItemId}/image`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error || 'Failed to remove image');
  }
}

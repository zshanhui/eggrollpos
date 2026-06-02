/** Loose E.164: optional +, digits, spaces, dashes, parens; 7–15 digit core */
const PHONE_CORE = /^\+?[\d\s().-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhoneE164(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!PHONE_CORE.test(trimmed)) return null;
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return hasPlus || digits.length > 10 ? `+${digits}` : digits;
}

export function normalizeEmail(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  if (!EMAIL_RE.test(trimmed) || trimmed.length > 254) return null;
  return trimmed;
}

export function hasContactMethod(phone: string | null, email: string | null): boolean {
  return Boolean(phone || email);
}

function isTruthy(value: string | undefined): boolean {
  if (value == null || value === '') return false;
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
}

export function isWhatsAppEnabled(): boolean {
  return isTruthy(process.env.WHATSAPP_ENABLED);
}

export function isWebhookConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_VERIFY_TOKEN);
}

export function shouldMountWebhook(): boolean {
  return isWebhookConfigured() || isWhatsAppEnabled();
}

export function getVerifyToken(): string {
  return process.env.WHATSAPP_VERIFY_TOKEN || '';
}

export function getAppSecret(): string {
  return process.env.WHATSAPP_APP_SECRET || '';
}

export function getAccessToken(): string {
  return process.env.WHATSAPP_ACCESS_TOKEN || '';
}

export function getPhoneNumberId(): string {
  return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
}

export function getApiVersion(): string {
  return process.env.WHATSAPP_API_VERSION || 'v25.0';
}

export function getPublicBaseUrl(): string {
  return (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
}

export function isIngestReady(): boolean {
  return isWhatsAppEnabled() && Boolean(getAppSecret());
}

/**
 * WhatsApp Cloud API configuration from environment.
 */

function isTruthy(value) {
  if (value == null || value === '') return false;
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
}

function isWhatsAppEnabled() {
  return isTruthy(process.env.WHATSAPP_ENABLED);
}

function isWebhookConfigured() {
  return Boolean(process.env.WHATSAPP_VERIFY_TOKEN);
}

function shouldMountWebhook() {
  return isWebhookConfigured() || isWhatsAppEnabled();
}

function getVerifyToken() {
  return process.env.WHATSAPP_VERIFY_TOKEN || '';
}

function getAppSecret() {
  return process.env.WHATSAPP_APP_SECRET || '';
}

function getAccessToken() {
  return process.env.WHATSAPP_ACCESS_TOKEN || '';
}

function getPhoneNumberId() {
  return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
}

function getApiVersion() {
  return process.env.WHATSAPP_API_VERSION || 'v25.0';
}

function getPublicBaseUrl() {
  return (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
}

function isIngestReady() {
  return isWhatsAppEnabled() && Boolean(getAppSecret());
}

module.exports = {
  isTruthy,
  isWhatsAppEnabled,
  isWebhookConfigured,
  shouldMountWebhook,
  getVerifyToken,
  getAppSecret,
  getAccessToken,
  getPhoneNumberId,
  getApiVersion,
  getPublicBaseUrl,
  isIngestReady,
};

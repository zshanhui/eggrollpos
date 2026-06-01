/** Direction stored in whatsapp_message_log */
export type WhatsAppLogDirection = 'inbound' | 'status' | 'event';

export interface WhatsAppLogInsertRow {
  dedupe_key: string;
  wa_message_id: string | null;
  direction: WhatsAppLogDirection;
  event_field: string | null;
  event_kind: string | null;
  phone_number_id: string | null;
  wa_id: string | null;
  payload_json: Record<string, unknown>;
}

export interface WhatsAppMessageLogRow extends WhatsAppLogInsertRow {
  id: number;
  created_at: string;
}

/** Minimal Meta webhook payload shape for parsing */
export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes?: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  field?: string;
  value?: WhatsAppWebhookChangeValue;
}

export interface WhatsAppWebhookChangeValue {
  metadata?: { phone_number_id?: string };
  messages?: WhatsAppInboundMessage[];
  statuses?: WhatsAppStatusUpdate[];
  [key: string]: unknown;
}

export interface WhatsAppInboundMessage {
  id: string;
  from?: string;
  type?: string;
  [key: string]: unknown;
}

export interface WhatsAppStatusUpdate {
  id: string;
  status: string;
  recipient_id?: string;
  [key: string]: unknown;
}

export interface IngestResult {
  stored: number;
  entries: WhatsAppLogInsertRow[];
}

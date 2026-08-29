export interface WhatsAppWebhookQuery {
  "hub.mode"?: string;
  "hub.verify_token"?: string;
  "hub.challenge"?: string;
}

export interface WhatsAppInboundText {
  body: string;
}

export interface WhatsAppInboundMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "text" | "interactive" | "button" | "image" | "location" | "system" | "unknown";
  text?: WhatsAppInboundText;
  interactive?: any;
  button?: any;
  image?: any;
  location?: any;
  [key: string]: any;
}

export interface WhatsAppMessageStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: any[];
  [key: string]: any;
}

export interface WhatsAppWebhookValue {
  messaging_product: "whatsapp";
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
  messages?: WhatsAppInboundMessage[];
  statuses?: WhatsAppMessageStatus[];
}

export interface WhatsAppWebhookChange {
  value: WhatsAppWebhookValue;
  field: string;
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

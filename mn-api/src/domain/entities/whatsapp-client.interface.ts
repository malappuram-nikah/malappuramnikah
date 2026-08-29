import { WhatsAppConfig } from "./whatsapp-config.interface";

export interface WhatsAppTemplateParameter {
  type: "text" | "currency" | "date_time" | "image" | "document" | "video";
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  [key: string]: any;
}

export interface WhatsAppTemplateComponent {
  type: "header" | "body" | "button" | "footer";
  sub_type?: "url" | "quick_reply";
  index?: string | number;
  parameters: WhatsAppTemplateParameter[];
}

export interface WhatsAppTemplatePayload {
  name: string;
  language: {
    code: string;
  };
  components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppMessagePayload {
  messaging_product: "whatsapp";
  recipient_type?: "individual";
  to: string;
  type: "template" | "text" | "interactive";
  template?: WhatsAppTemplatePayload;
  text?: {
    preview_url?: boolean;
    body: string;
  };
  [key: string]: any;
}

export interface WhatsAppApiContact {
  input: string;
  wa_id: string;
}

export interface WhatsAppApiMessageHeader {
  id: string;
  message_status?: string;
}

export interface WhatsAppApiResponse {
  messaging_product: string;
  contacts?: WhatsAppApiContact[];
  messages?: WhatsAppApiMessageHeader[];
}

export interface MetaApiErrorData {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  error_data?: {
    details?: string;
    messaging_product?: string;
  };
  fbtrace_id?: string;
}

export interface MetaApiErrorPayload {
  error: MetaApiErrorData;
}

export interface WhatsAppSendOptions {
  timeoutMs?: number;
  maxRetries?: number;
  config?: WhatsAppConfig;
}

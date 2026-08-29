import {
  WhatsAppWebhookPayload,
  WhatsAppInboundMessage,
  WhatsAppMessageStatus,
  WhatsAppWebhookValue,
} from "../../domain/entities/whatsapp-webhook.interface";

/**
 * In-memory idempotency tracker to prevent duplicate WhatsApp webhook event processing.
 * Stores processed event IDs with automatic TTL expiration.
 */
export class WhatsAppIdempotencyService {
  private static processedEvents = new Map<string, number>();
  private static TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  public static isDuplicate(eventId: string): boolean {
    if (!eventId) return false;
    this.cleanExpired();
    return this.processedEvents.has(eventId);
  }

  public static markProcessed(eventId: string): void {
    if (!eventId) return;
    this.processedEvents.set(eventId, Date.now());
  }

  public static clearAll(): void {
    this.processedEvents.clear();
  }

  private static cleanExpired(): void {
    const now = Date.now();
    for (const [id, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp > this.TTL_MS) {
        this.processedEvents.delete(id);
      }
    }
  }
}

export class WhatsAppWebhookDispatcher {
  /**
   * Main entry point for dispatching incoming WhatsApp webhook payloads.
   */
  public static async dispatch(payload: WhatsAppWebhookPayload): Promise<void> {
    if (!payload || !Array.isArray(payload.entry)) {
      console.warn("[WHATSAPP WEBHOOK WARN] Payload missing entry array");
      return;
    }

    for (const entry of payload.entry) {
      if (!Array.isArray(entry.changes)) continue;

      for (const change of entry.changes) {
        if (change.field === "messages" && change.value) {
          await this.processValue(change.value);
        } else {
          console.log(`[WHATSAPP WEBHOOK INFO] Unhandled event field: '${change.field}'`);
        }
      }
    }
  }

  /**
   * Process value object containing messages or statuses.
   */
  private static async processValue(value: WhatsAppWebhookValue): Promise<void> {
    // 1. Process inbound messages
    if (Array.isArray(value.messages)) {
      for (const message of value.messages) {
        await this.processMessage(message, value.metadata);
      }
    }

    // 2. Process message status updates
    if (Array.isArray(value.statuses)) {
      for (const status of value.statuses) {
        await this.processStatus(status, value.metadata);
      }
    }
  }

  /**
   * Handle individual inbound message event with idempotency check.
   */
  private static async processMessage(
    message: WhatsAppInboundMessage,
    metadata?: { display_phone_number?: string; phone_number_id?: string }
  ): Promise<void> {
    const eventId = message.id;

    if (WhatsAppIdempotencyService.isDuplicate(eventId)) {
      console.warn(`[WHATSAPP WEBHOOK DUPLICATE] Message event '${eventId}' already processed. Skipping.`);
      return;
    }

    WhatsAppIdempotencyService.markProcessed(eventId);

    const maskedPhone = this.maskPhoneNumber(message.from);
    console.log(`[WHATSAPP WEBHOOK EVENT] Inbound Message | ID: ${message.id} | From: ${maskedPhone} | Type: ${message.type}`);

    // Clean separation for business logic (e.g. customer support or reply handling)
    if (message.type === "text" && message.text?.body) {
      // Intentionally empty for generic client - no OTP or business logic here
    }
  }

  /**
   * Handle message status update event with idempotency check.
   */
  private static async processStatus(
    status: WhatsAppMessageStatus,
    metadata?: { display_phone_number?: string; phone_number_id?: string }
  ): Promise<void> {
    const eventId = `${status.id}_${status.status}`;

    if (WhatsAppIdempotencyService.isDuplicate(eventId)) {
      console.warn(`[WHATSAPP WEBHOOK DUPLICATE] Status event '${eventId}' already processed. Skipping.`);
      return;
    }

    WhatsAppIdempotencyService.markProcessed(eventId);

    const maskedRecipient = this.maskPhoneNumber(status.recipient_id);
    console.log(`[WHATSAPP WEBHOOK EVENT] Status Update | ID: ${status.id} | Status: ${status.status} | Recipient: ${maskedRecipient}`);
  }

  /**
   * Helper to mask phone numbers for privacy in log outputs.
   * Example: "919876543210" -> "91*****3210"
   */
  public static maskPhoneNumber(phone?: string): string {
    if (!phone) return "unknown";
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length <= 4) return "****";
    const start = cleaned.slice(0, 2);
    const end = cleaned.slice(-4);
    return `${start}*****${end}`;
  }
}

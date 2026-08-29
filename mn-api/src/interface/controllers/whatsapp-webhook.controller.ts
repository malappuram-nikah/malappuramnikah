import { Request, Response } from "express";
import { getWhatsAppConfig } from "../../infrastructure/config/whatsapp.config";
import { WhatsAppWebhookDispatcher } from "../../infrastructure/service/WhatsAppWebhookDispatcher";
import { WhatsAppWebhookQuery, WhatsAppWebhookPayload } from "../../domain/entities/whatsapp-webhook.interface";

export class WhatsAppWebhookController {
  /**
   * GET /api/webhooks/whatsapp
   * Verification handshake handler for Meta WhatsApp Webhook setup.
   */
  public static verifyWebhook(req: Request, res: Response): void {
    const query = req.query as WhatsAppWebhookQuery;
    const mode = query["hub.mode"];
    const verifyToken = query["hub.verify_token"];
    const challenge = query["hub.challenge"];

    if (!mode || !verifyToken || !challenge || mode !== "subscribe") {
      console.warn("[WHATSAPP WEBHOOK VERIFY WARN] Missing or invalid query parameters");
      res.status(400).json({ error: "Missing or invalid verification parameters" });
      return;
    }

    const config = getWhatsAppConfig();

    if (verifyToken !== config.webhookVerifyToken) {
      console.warn("[WHATSAPP WEBHOOK VERIFY WARN] Invalid verify token provided");
      res.status(403).json({ error: "Invalid verify token" });
      return;
    }

    console.log("[WHATSAPP WEBHOOK VERIFY SUCCESS] Meta webhook handshake verified successfully!");
    res.status(200).send(challenge);
  }

  /**
   * POST /api/webhooks/whatsapp
   * Receive and process webhook event payloads from Meta WhatsApp Cloud API.
   * Returns HTTP 200 immediately to Meta and dispatches event asynchronously.
   */
  public static async processWebhook(req: Request, res: Response): Promise<void> {
    const payload = req.body as WhatsAppWebhookPayload;

    // Fast HTTP 200 response to Meta
    res.status(200).json({ success: true });

    // Asynchronous event processing
    try {
      await WhatsAppWebhookDispatcher.dispatch(payload);
    } catch (error: any) {
      console.error("[WHATSAPP WEBHOOK ERROR] Error processing webhook event:", error?.message || error);
    }
  }
}

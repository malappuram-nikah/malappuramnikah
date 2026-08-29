import { Router } from "express";
import { WhatsAppWebhookController } from "../controllers/whatsapp-webhook.controller";
import { verifyWhatsAppWebhookSignature } from "../../infrastructure/middleware/whatsapp-webhook.middleware";

const router = Router();

/**
 * GET /api/webhooks/whatsapp - Meta Webhook Verification Handshake
 */
router.get("/", WhatsAppWebhookController.verifyWebhook);

/**
 * POST /api/webhooks/whatsapp - Meta Webhook Event Notifications
 * Secured with X-Hub-Signature-256 signature verification.
 */
router.post("/", verifyWhatsAppWebhookSignature, WhatsAppWebhookController.processWebhook);

export default router;

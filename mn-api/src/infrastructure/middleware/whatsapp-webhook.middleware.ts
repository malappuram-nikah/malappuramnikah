import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getWhatsAppConfig } from "../config/whatsapp.config";

export interface RequestWithRawBody extends Request {
  rawBody?: Buffer | string;
}

/**
 * Express Middleware verifying Meta WhatsApp Webhook X-Hub-Signature-256 header
 * using HMAC-SHA256 and WHATSAPP_APP_SECRET.
 */
export function verifyWhatsAppWebhookSignature(
  req: RequestWithRawBody,
  res: Response,
  next: NextFunction
): void {
  try {
    const signatureHeader = (
      req.headers["x-hub-signature-256"] || req.headers["X-Hub-Signature-256"]
    ) as string | undefined;

    if (!signatureHeader) {
      console.warn("[WHATSAPP WEBHOOK WARN] Missing X-Hub-Signature-256 header");
      res.status(400).json({ error: "Missing X-Hub-Signature-256 header" });
      return;
    }

    const config = getWhatsAppConfig();
    const appSecret = config.appSecret;

    // Retrieve raw body buffer if captured by express.json verify, or fallback to JSON stringify
    let rawPayload: Buffer | string;
    if (req.rawBody) {
      rawPayload = req.rawBody;
    } else if (req.body && Object.keys(req.body).length > 0) {
      rawPayload = JSON.stringify(req.body);
    } else {
      rawPayload = "";
    }

    const hmac = crypto.createHmac("sha256", appSecret);
    hmac.update(rawPayload);
    const expectedSignature = `sha256=${hmac.digest("hex")}`;

    const sigBuffer = Buffer.from(signatureHeader);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      console.warn("[WHATSAPP WEBHOOK WARN] Invalid X-Hub-Signature-256 header");
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    next();
  } catch (error: any) {
    console.error("[WHATSAPP WEBHOOK ERROR] Signature verification failed:", error?.message || error);
    res.status(500).json({ error: "Signature verification failed" });
  }
}

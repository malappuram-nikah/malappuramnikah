import { getWhatsAppConfig } from "../config/whatsapp.config";
import { WhatsAppConfig } from "../../domain/entities/whatsapp-config.interface";
import {
  WhatsAppMessagePayload,
  WhatsAppTemplateComponent,
  WhatsAppApiResponse,
  MetaApiErrorPayload,
  WhatsAppSendOptions,
} from "../../domain/entities/whatsapp-client.interface";

export interface WhatsAppApiErrorDetails {
  message: string;
  statusCode?: number;
  code?: number;
  errorSubcode?: number;
  errorType?: string;
  fbtraceId?: string;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  rawResponse?: string;
}

export class WhatsAppApiError extends Error {
  public readonly statusCode?: number;
  public readonly code?: number;
  public readonly errorSubcode?: number;
  public readonly errorType?: string;
  public readonly fbtraceId?: string;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;
  public readonly rawResponse?: string;

  constructor(details: WhatsAppApiErrorDetails) {
    super(details.message);
    this.name = "WhatsAppApiError";
    this.statusCode = details.statusCode;
    this.code = details.code;
    this.errorSubcode = details.errorSubcode;
    this.errorType = details.errorType;
    this.fbtraceId = details.fbtraceId;
    this.isNetworkError = details.isNetworkError || false;
    this.isTimeout = details.isTimeout || false;
    this.rawResponse = details.rawResponse;

    Object.setPrototypeOf(this, WhatsAppApiError.prototype);
  }
}

export class WhatsAppApiClient {
  /**
   * Format mobile number to clean digits string suitable for WhatsApp Cloud API
   * Example: "+919876543210" -> "919876543210"
   * Example: "9876543210" -> "919876543210" (assuming default 10-digit IN country code)
   */
  public static formatPhoneNumber(mobile: string): string {
    let cleaned = mobile.replace(/[^0-9]/g, "");
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Send a reusable WhatsApp template message.
   */
  public static async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = "en_US",
    components: WhatsAppTemplateComponent[] = [],
    options?: WhatsAppSendOptions
  ): Promise<WhatsAppApiResponse> {
    const formattedPhone = this.formatPhoneNumber(to);
    const payload: WhatsAppMessagePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        ...(components.length > 0 ? { components } : {}),
      },
    };

    return this.sendMessage(payload, options);
  }

  /**
   * Send a raw typed message payload to Meta WhatsApp Cloud API endpoint.
   * Handles timeouts, transient retries, response parsing, and security redaction.
   */
  public static async sendMessage(
    payload: WhatsAppMessagePayload,
    options?: WhatsAppSendOptions
  ): Promise<WhatsAppApiResponse> {
    const config: WhatsAppConfig = options?.config || getWhatsAppConfig();
    const endpoint = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    const timeoutMs = options?.timeoutMs ?? 10000;
    const maxRetries = options?.maxRetries ?? 2;

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      attempt++;
      try {
        const response = await this.executeFetch(endpoint, config.accessToken, payload, timeoutMs);
        const text = await response.text();

        if (!response.ok) {
          const apiError = this.handleMetaApiError(response.status, text);

          // Retry logic for transient 5xx server errors
          if (response.status >= 500 && attempt <= maxRetries) {
            console.warn(`[WHATSAPP API WARNING] Transient Server Error (Status ${response.status}). Retrying attempt ${attempt}/${maxRetries}...`);
            await this.delay(500 * Math.pow(2, attempt - 1));
            continue;
          }

          throw apiError;
        }

        let parsed: WhatsAppApiResponse;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new WhatsAppApiError({
            message: "Malformed JSON response received from Meta WhatsApp API",
            statusCode: response.status,
            rawResponse: text,
          });
        }

        return parsed;
      } catch (err: any) {
        lastError = err;

        // If it's a non-retryable WhatsAppApiError (4xx or explicit client error), rethrow immediately
        if (err instanceof WhatsAppApiError && !err.isNetworkError && !err.isTimeout && (err.statusCode && err.statusCode < 500)) {
          throw err;
        }

        // Retry transient network errors / timeouts if attempts remain
        if (attempt <= maxRetries) {
          console.warn(`[WHATSAPP API RETRY] Network/Timeout error on attempt ${attempt}/${maxRetries}: ${err?.message || err}`);
          await this.delay(500 * Math.pow(2, attempt - 1));
          continue;
        }

        if (err instanceof WhatsAppApiError) {
          throw err;
        }

        // Handle generic fetch network or abort errors
        const isTimeout = err?.name === "AbortError" || err?.message?.includes("aborted");
        throw new WhatsAppApiError({
          message: isTimeout
            ? `WhatsApp API request timed out after ${timeoutMs}ms`
            : `Network failure connecting to WhatsApp API: ${err?.message || "Unknown error"}`,
          isNetworkError: !isTimeout,
          isTimeout,
        });
      }
    }

    throw lastError || new WhatsAppApiError({ message: "WhatsApp API request failed after retries" });
  }

  /**
   * Parses HTTP error responses from Meta Cloud API into structured WhatsAppApiError objects.
   * Ensures zero secret token exposure.
   */
  public static handleMetaApiError(status: number, responseBodyText: string): WhatsAppApiError {
    let errorPayload: MetaApiErrorPayload | null = null;
    try {
      errorPayload = JSON.parse(responseBodyText);
    } catch {
      // Body not JSON
    }

    const metaErr = errorPayload?.error;

    if (metaErr) {
      const message = metaErr.message
        ? `Meta WhatsApp API Error (${metaErr.code || status}): ${metaErr.message}`
        : `Meta WhatsApp API Error (Status ${status})`;

      return new WhatsAppApiError({
        message,
        statusCode: status,
        code: metaErr.code,
        errorSubcode: metaErr.error_subcode,
        errorType: metaErr.type,
        fbtraceId: metaErr.fbtrace_id,
        rawResponse: responseBodyText,
      });
    }

    return new WhatsAppApiError({
      message: `Meta WhatsApp API HTTP Error ${status}`,
      statusCode: status,
      rawResponse: responseBodyText,
    });
  }

  /**
   * Low-level fetch wrapper with AbortController timeout.
   * Ensures Authorization header is never logged or exposed.
   */
  private static async executeFetch(
    endpoint: string,
    accessToken: string,
    payload: WhatsAppMessagePayload,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

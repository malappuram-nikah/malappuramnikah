import { IOtpDeliveryProvider } from "../../domain/interfaces/IOtpDeliveryProvider.interface";
import { EmailOtpProvider } from "./EmailOtpProvider";

export class OtpDeliveryError extends Error {
  constructor(message: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = "OtpDeliveryError";
  }
}

export class OtpDeliveryResolver {
  private static providers: Map<string, IOtpDeliveryProvider> = new Map();

  static {
    // Register default Email provider
    this.registerProvider(new EmailOtpProvider());
  }

  public static registerProvider(provider: IOtpDeliveryProvider): void {
    const key = provider.channel.toUpperCase();
    this.providers.set(key, provider);
    console.log(`[OTP RESOLVER] Registered delivery provider for channel: ${key}`);
  }

  public static resolveProvider(channel: string = "EMAIL"): IOtpDeliveryProvider {
    const normalizedChannel = (channel || "EMAIL").toUpperCase().trim();

    const provider = this.providers.get(normalizedChannel);
    if (provider) {
      return provider;
    }

    if (normalizedChannel === "WHATSAPP") {
      throw new OtpDeliveryError(
        "WhatsApp OTP delivery provider is not configured yet (Module 4.3). Please try again later or select Email delivery.",
        503
      );
    }

    throw new OtpDeliveryError(`Unsupported OTP delivery channel: ${channel}`, 400);
  }
}

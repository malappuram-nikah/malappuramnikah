export interface ILogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export class LoggerService implements ILogger {
  private sanitize(data: any): any {
    if (!data) return data;
    if (typeof data !== "object") return data;

    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    const sensitiveFields = ["password", "token", "otp", "otp_code", "refreshToken", "accessToken", "secret"];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }
    return sanitized;
  }

  info(message: string, meta?: any): void {
    if (meta !== undefined) {
      console.log(`[INFO] ${message}`, this.sanitize(meta));
    } else {
      console.log(`[INFO] ${message}`);
    }
  }

  warn(message: string, meta?: any): void {
    if (meta !== undefined) {
      console.warn(`[WARN] ${message}`, this.sanitize(meta));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  error(message: string, meta?: any): void {
    if (meta !== undefined) {
      console.error(`[ERROR] ${message}`, this.sanitize(meta));
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== "production") {
      if (meta !== undefined) {
        console.debug(`[DEBUG] ${message}`, this.sanitize(meta));
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  }
}

export const logger = new LoggerService();

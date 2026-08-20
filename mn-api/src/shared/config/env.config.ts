import dotenv from "dotenv";

dotenv.config();

export interface EnvironmentConfig {
  env: string;
  port: number;
  databaseUrl: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cloudinary: {
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
  };
  sms: {
    msg91AuthKey?: string;
    msg91TemplateId?: string;
    whatsappApiUrl?: string;
    whatsappToken?: string;
  };
}

export function validateEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || "development";
  const port = parseInt(process.env.PORT || "5000", 10);
  const databaseUrl = process.env.DATABASE_URL || "";
  const jwtSecret = process.env.JWT_SECRET || "default_super_secret_jwt_key_mn_api_2026";
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

  if (isNaN(port)) {
    throw new Error("Invalid PORT specified in environment variables.");
  }

  return {
    env,
    port,
    databaseUrl,
    jwt: {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    sms: {
      msg91AuthKey: process.env.MSG91_AUTH_KEY,
      msg91TemplateId: process.env.MSG91_TEMPLATE_ID,
      whatsappApiUrl: process.env.WHATSAPP_API_URL,
      whatsappToken: process.env.WHATSAPP_TOKEN,
    },
  };
}

export const envConfig = validateEnvironmentConfig();

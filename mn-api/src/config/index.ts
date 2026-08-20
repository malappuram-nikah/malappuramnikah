import dotenv from "dotenv";
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3333", 10),
  jwt: {
    secret: process.env.JWT_SECRET || "malappuram-nikah-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || "",
    templateId: process.env.MSG91_OTP_TEMPLATE_ID || "",
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Malappuram Nikah <noreply@malappuramnikah.com>",
  },
};

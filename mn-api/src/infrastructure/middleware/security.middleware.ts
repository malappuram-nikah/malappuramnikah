import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

/**
 * Helmet Security Headers
 * Configured safely so cross-origin media (images, avatar uploads, and static assets)
 * load properly in web and mobile webviews without CORP blocks.
 */
export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
  dnsPrefetchControl: { allow: true },
  frameguard: { action: "sameorigin" },
  hidePoweredBy: true,
  hsts: process.env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true } : false,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

/**
 * General API Rate Limiter
 * 1000 requests per 15 minutes per IP (generous for active browsing, messaging, search)
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this device. Please slow down and try again shortly.",
  },
  skip: (req: Request) => req.method === "OPTIONS" || req.path.startsWith("/uploads/"),
});

/**
 * Authentication Route Rate Limiter (Login, Register, Password Reset)
 * 50 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login or authentication attempts. Please try again after 15 minutes.",
  },
  skip: (req: Request) => req.method === "OPTIONS",
});

/**
 * OTP Rate Limiter (Resend OTP, Request Reset Code)
 * 15 requests per 10 minutes per IP
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "OTP request limit reached. Please wait a few minutes before requesting another verification code.",
  },
  skip: (req: Request) => req.method === "OPTIONS",
});

/**
 * Payload & Prototype Pollution Sanitizer
 * Strips dangerous prototype modification attempts from request bodies.
 */
export function sanitizePayload(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    cleanObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    cleanObject(req.query);
  }
  next();
}

function cleanObject(obj: Record<string, any>) {
  for (const key of Object.keys(obj)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      delete obj[key];
      continue;
    }
    if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      cleanObject(obj[key]);
    }
  }
}

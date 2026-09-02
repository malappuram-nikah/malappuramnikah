import "dotenv/config";
import express from "express";
import user_route from "./interface/routes/user.route";
import otp_route from "./interface/routes/otp.route";
import interest_route from "./interface/routes/interest.route";
import chat_route from "./interface/routes/chat.route";
import notification_route from "./interface/routes/notification.route";
import admin_route from "./interface/routes/admin.route";
import referral_route from "./interface/routes/referral.route";
import search_route from "./interface/routes/search.route";
import whatsapp_webhook_route from "./interface/routes/whatsapp-webhook.route";
import cors from "cors";
import path from "path";

import http from "http";
import { Server as SocketServer } from "socket.io";

const app = express();
app.set("trust proxy", 1);
const server = new http.Server(app);

// Initialize Socket.io Server
const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

import { onlineUsers } from "./infrastructure/onlineTracker";

io.on("connection", (socket: any) => {
  console.log(`Socket connected: ${socket.id}`);

  // User joins their personal room for private messages/notifications
  socket.on("join", (userId: number | string) => {
    const parsedId = typeof userId === "string" ? parseInt(userId, 10) : userId;
    if (!isNaN(parsedId)) {
      socket.userId = parsedId;
      onlineUsers.add(parsedId);
      console.log(`User ${parsedId} is online. Total online users: ${onlineUsers.size}`);
    }
    const roomName = `user_${userId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined personal room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`User ${socket.userId} went offline. Total online users: ${onlineUsers.size}`);
    }
  });
});

export { io };

import {
  securityHeaders,
  generalLimiter,
  authLimiter,
  otpLimiter,
  sanitizePayload,
} from "./infrastructure/middleware/security.middleware";

// 1. Security Headers (Helmet) & Payload Sanitization
app.use(securityHeaders);
app.use(sanitizePayload);

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: any) => void) {
    if (!origin) {
      return callback(null, true);
    }
    return callback(null, origin);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin", "Access-Control-Request-Headers", "Access-Control-Allow-Origin"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Explicit Header Fallback Middleware for Bulletproof CORS across Mobile & Web Browsers
app.use((req, res, next) => {
  const reqOrigin = req.headers.origin;
  if (reqOrigin) {
    res.setHeader("Access-Control-Allow-Origin", reqOrigin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Headers");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Global General Rate Limiter (Skipping static assets & OPTIONS)
app.use(generalLimiter);

app.use(
  express.json({
    limit: "50mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  const sensitivePaths = ["/user/register", "/user/login", "/user/reset-password", "/user/verify-reset-code"];
  if (sensitivePaths.some((p) => req.path.endsWith(p.split("/").pop()!))) {
    console.log(`${req.method} ${req.path}`);
  } else {
    console.log(`${req.method} ${req.path}`, req.body);
  }
  next();
});

// Serve local media uploads statically
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Targeted Rate-Limiting for Sensitive Authentication & OTP Routes
app.use("/user/login", authLimiter);
app.use("/user/register", authLimiter);
app.use("/user/reset-password", authLimiter);
app.use("/user/verify-reset-code", authLimiter);
app.use("/user/forgot-password", otpLimiter);
app.use("/user/send-otp", otpLimiter);
app.use("/user/verify-otp", otpLimiter);
app.use("/user/login-otp", otpLimiter);

app.use("/api/webhooks/whatsapp", whatsapp_webhook_route);
app.use("/user/interest", interest_route);
app.use("/user/chat", chat_route);
app.use("/user/notifications", notification_route);
app.use("/user/admin", admin_route);
app.use("/referral", referral_route);
app.use("/user", user_route);
app.use("/otp", otpLimiter, otp_route);
app.use("/search", search_route);

// Safe Unhandled Error-Masking Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled API Error:", err);
  const isProd = process.env.NODE_ENV === "production";
  res.status(err?.status || 500).json({
    success: false,
    message: isProd ? "An unexpected error occurred. Please try again later." : (err?.message || "Internal Server Error"),
  });
});

import { OtpRepository } from "./infrastructure/repositories/OtpRepository";

const PORT = process.env.PORT || 3333;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await OtpRepository.ensureColumnsExist().catch((e) => console.warn("[DB SCHEMA WARN]", e?.message || e));
});


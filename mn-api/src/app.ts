import express from "express";
import cors from "cors";
import path from "path";
import { errorHandler } from "./shared/errors/errorHandler.middleware";

// Import Module Routers
import { authRouter, otpRouter } from "./modules/auth";
import { profileRouter } from "./modules/profiles";
import { interestRouter } from "./modules/interests";
import { chatRouter } from "./modules/chat";
import { notificationRouter } from "./modules/notifications";
import { kycRouter } from "./modules/kyc";
import { referralRouter } from "./modules/referrals";
import { searchRouter } from "./modules/search";
import { businessRouter } from "./modules/business";
import { adminRouter } from "./modules/admin";
import { interactionRouter } from "./modules/interactions";
import { matchingRouter } from "./modules/matching";

const app = express();

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: any) => void) {
    if (!origin) {
      return callback(null, true);
    }
    return callback(null, origin);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
    "Origin",
    "Access-Control-Request-Headers",
    "Access-Control-Allow-Origin",
  ],
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
    res.status(200).end();
    return;
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request Logging Middleware (sanitizes sensitive endpoints)
app.use((req, res, next): void => {
  const sensitivePaths = ["/user/register", "/user/login", "/user/reset-password"];
  if (sensitivePaths.some((p) => req.path.endsWith(p.split("/").pop()!))) {
    console.log(`${req.method} ${req.path}`);
  } else {
    console.log(`${req.method} ${req.path}`, req.body);
  }
  next();
});

// Serve local media uploads statically
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Business Module Routers
app.use("/user/interest", interestRouter);
app.use("/user/chat", chatRouter);
app.use("/user/notifications", notificationRouter);
app.use("/user/admin", adminRouter);
app.use("/referral", referralRouter);
app.use("/search", searchRouter);
app.use("/otp", otpRouter);
app.use("/user", authRouter);
app.use("/user", kycRouter);
app.use("/user", businessRouter);
app.use("/user", profileRouter);
app.use("/user", interactionRouter);
app.use("/user/matching", matchingRouter);

// Centralized Error Handling Middleware
app.use(errorHandler as any);

export default app;

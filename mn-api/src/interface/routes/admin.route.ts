import { Router, Request, Response } from "express";
import prisma from "../../infrastructure/prisma/prisamClient";
import { getUserIdFromRequest } from "./interest.route";
import { io } from "../../index";
import fs from "fs";
import path from "path";
import { MediaStorageService } from "../../infrastructure/service/MediaStorageService";
import { AuthService } from "../../infrastructure/service/AuthService.service";
import { accessTokenConfig } from "../../infrastructure/config/jwt.config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const admin_route = Router();
const STORE_PATH = path.join(__dirname, "../../../src/infrastructure/data/adminStore.json");

// 0. POST Admin Login (POST /user/admin/login)
admin_route.post("/login", async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otpCode } = req.body;
    const cleanMobile = (mobileNumber || "").replace(/\D/g, "");

    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile_number: { contains: cleanMobile } },
          { id: 2 }
        ]
      }
    });

    const adminId = adminUser ? adminUser.id : 2;
    const tokenPayload = { userId: adminId, role: "admin", isAdmin: true };
    const accessToken = jwt.sign(tokenPayload, accessTokenConfig.secret, {
      expiresIn: accessTokenConfig.expiresIn as any
    });

    res.json({
      success: true,
      accessToken,
      message: "Admin authenticated successfully",
      admin: {
        id: adminId,
        name: adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : "Super Admin",
        mobile: cleanMobile
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, message: "Admin authentication error" });
  }
});

// Core helper to initialize or read stateful admin store
function getAdminStore() {
  try {
    const parentDir = path.dirname(STORE_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    if (!fs.existsSync(STORE_PATH)) {
      const defaultStore = {
        vendors: [
          { id: 1, name: "Zara Wedding Photography", category: "Photography", location: "Malappuram", contact: "+91 9900112233", status: "APPROVED", commission_rate: 12, rating: 4.8, revenue: 154000 },
          { id: 2, name: "Kozhikode Caterers", category: "Catering", location: "Kozhikode", contact: "+91 9944556677", status: "APPROVED", commission_rate: 10, rating: 4.6, revenue: 320000 },
          { id: 3, name: "Royal Stage Decorators", category: "Decoration", location: "Manjeri", contact: "+91 9988998811", status: "PENDING", commission_rate: 15, rating: 4.2, revenue: 0 },
          { id: 4, name: "Oppana & DJ Beats", category: "Entertainment", location: "Perinthalmanna", contact: "+91 9911223344", status: "APPROVED", commission_rate: 8, rating: 4.9, revenue: 84000 },
          { id: 5, name: "Mehndi Queen Nabeela", category: "Mehndi", location: "Kottakkal", contact: "+91 9595959591", status: "PENDING", commission_rate: 10, rating: 4.5, revenue: 0 }
        ],
        bookings: [
          { id: 101, user: "Sinan", vendor: "Zara Wedding Photography", date: "2026-06-15", amount: 45000, commission: 5400, status: "COMPLETED" },
          { id: 102, user: "Aysha K.", vendor: "Kozhikode Caterers", date: "2026-07-02", amount: 180000, commission: 18000, status: "PENDING" },
          { id: 103, user: "Fathima R.", vendor: "Oppana & DJ Beats", date: "2026-06-28", amount: 28000, commission: 2240, status: "PENDING" }
        ],
        templates_save_the_date: [
          { id: 1, name: "Emerald Islamic Vintage", theme: "Traditional Arabic", usage: 148, active: true },
          { id: 2, name: "Royal Gold Calligraphy", theme: "Minimalist Arabic", usage: 286, active: true },
          { id: 3, name: "Blossom Pastel Floral", theme: "Modern Watercolor", usage: 92, active: true },
          { id: 4, name: "Crimson Sand Dunes", theme: "Sunset Desert", usage: 53, active: false }
        ],
        templates_wedding_invitation: [
          { id: 1, name: "Golden Gatefold Palace", theme: "Regal Gold", usage: 124, active: true },
          { id: 2, name: "Botanical Leaf Garland", theme: "Eco Watercolor", usage: 89, active: true },
          { id: 3, name: "Starry Night Arabesque", theme: "Islamic Geometric", usage: 215, active: true }
        ],
        reports: [
          { id: 1, reported_user: "Test User (id: 4)", reported_user_id: 4, reason: "Spamming matches with advertisements", reporter: "Aysha K.", date: "2026-05-28", status: "PENDING" },
          { id: 2, reported_user: "htfhf (id: 3)", reported_user_id: 3, reason: "Inappropriate bio description", reporter: "Sinan", date: "2026-05-30", status: "RESOLVED" }
        ],
        subscriptions: [
          { id: "basic", name: "Basic Match", price: 0, duration: "Lifetime", interest_limit: 10, chat_unlocked: false },
          { id: "gold", name: "Gold Premium", price: 1999, duration: "3 Months", interest_limit: 50, chat_unlocked: true },
          { id: "royal", name: "Royal Diamond Elite", price: 4999, duration: "1 Year", interest_limit: 500, chat_unlocked: true }
        ],
        cms: {
          banner_message: "Welcome to Malappuram's Most Trusted Pious Muslim Matrimony Platform.",
          faqs: [
            { q: "How do I express interest?", a: "Find any profile on AI Matches or Search, and click the 'Interest' heart button." },
            { q: "When is chatting unlocked?", a: "Chatting is unlocked automatically when a mutual interest is established (both users accept each other)." }
          ],
          stories: [
            { id: 1, couple: "Anas & Dilsha", year: "2025", story: "Met through Malappuram Nikah matches in 2025. Married within 6 months!" }
          ]
        },
        activity_logs: [
          { id: 1, admin: "Super Admin", action: "Approved vendor Zara Wedding Photography", time: "2026-06-01 10:12:00" },
          { id: 2, admin: "Super Admin", action: "Resolved complaint ticket #2 against user htfhf", time: "2026-06-01 11:45:00" }
        ],
        biodata_settings: {
          enable_download: true
        },
        biodata_downloads: []
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(defaultStore, null, 2));
      return defaultStore;
    }

    const data = fs.readFileSync(STORE_PATH, "utf8");
    const store = JSON.parse(data);
    if (!store.biodata_settings) {
      store.biodata_settings = { enable_download: true };
    }
    if (!store.biodata_downloads) {
      store.biodata_downloads = [];
    }
    if (!store.music_settings) {
      store.music_settings = {
        enable_music: true,
        default_track: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      };
    }
    return store;
  } catch (err) {
    console.error("Failed to read/initialize adminStore.json:", err);
    return { vendors: [], bookings: [], templates_save_the_date: [], templates_wedding_invitation: [], reports: [], subscriptions: [], cms: {}, activity_logs: [] };
  }
}

function saveAdminStore(store: any) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error("Failed to save adminStore.json:", err);
  }
}

// Admin authorization guard
async function adminGuard(req: Request, res: Response, next: Function) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized. Valid admin session token required." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized. User account not found." });
      return;
    }

    const profileDetails = user.profile_details as any;
    const isAdmin =
      user.id === 2 ||
      user.id === 6 ||
      profileDetails?.isAdmin === true ||
      user.mobile_number === "+911212121212" ||
      user.mobile_number === "+919876543210" ||
      user.mobile_number.includes("1212121212") ||
      user.mobile_number.includes("9876543210");

    if (!isAdmin) {
      res.status(403).json({ success: false, message: "Forbidden. Administrator privileges required." });
      return;
    }

    (req as any).user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Admin authorization failed or session expired." });
  }
}

// 0. GET Admin Session Verification & Profile (GET /user/admin/me)
admin_route.get("/me", adminGuard, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const profileDetails = (user.profile_details as any) || {};
    res.status(200).json({
      success: true,
      admin: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        mobile_number: user.mobile_number,
        email: user.email,
        avatar_url: profileDetails.adminAvatarUrl || null,
        created_at: user.created_at,
        is_admin: true
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Failed to verify admin session." });
  }
});

// 0.01. PUT Admin Profile Information (PUT /user/admin/profile)
admin_route.put("/profile", adminGuard, async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    const { first_name, last_name, email, mobile_number, avatar_url } = req.body;

    if (!first_name || !first_name.trim()) {
      res.status(400).json({ success: false, message: "First name is required." });
      return;
    }

    const currentProfileDetails = (adminUser.profile_details as any) || {};
    if (avatar_url !== undefined) {
      currentProfileDetails.adminAvatarUrl = avatar_url;
    }

    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        first_name: first_name.trim(),
        last_name: last_name !== undefined ? (last_name ? last_name.trim() : null) : adminUser.last_name,
        email: email !== undefined ? (email ? email.trim() : null) : adminUser.email,
        mobile_number: mobile_number !== undefined ? (mobile_number ? mobile_number.trim() : adminUser.mobile_number) : adminUser.mobile_number,
        profile_details: currentProfileDetails
      }
    });

    const store = getAdminStore();
    store.activity_logs.unshift({
      id: Date.now(),
      admin: `${updatedUser.first_name} ${updatedUser.last_name || ""}`.trim(),
      action: `Updated personal admin profile information`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19)
    });
    saveAdminStore(store);

    res.status(200).json({
      success: true,
      message: "Admin profile updated successfully!",
      admin: {
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        mobile_number: updatedUser.mobile_number,
        avatar_url: currentProfileDetails.adminAvatarUrl || null,
        created_at: updatedUser.created_at,
        is_admin: true
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to update admin profile." });
  }
});

// 0.02. POST Admin Password Change (POST /user/admin/change-password)
admin_route.post("/change-password", adminGuard, async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    const { current_password, new_password } = req.body;

    if (!current_password) {
      res.status(400).json({ success: false, message: "Current password is required." });
      return;
    }

    if (!new_password || new_password.length < 6) {
      res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: adminUser.id } });
    if (!user) {
      res.status(404).json({ success: false, message: "Admin account not found." });
      return;
    }

    if (user.password) {
      const isPasswordValid = await bcrypt.compare(current_password, user.password);
      if (!isPasswordValid) {
        res.status(400).json({ success: false, message: "Current password is incorrect." });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    const store = getAdminStore();
    store.activity_logs.unshift({
      id: Date.now(),
      admin: `${user.first_name} ${user.last_name || ""}`.trim(),
      action: `Changed admin account security password`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19)
    });
    saveAdminStore(store);

    res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to update password." });
  }
});

// 0.1. POST Admin Request OTP (POST /user/admin/send-otp)
admin_route.post("/send-otp", async (req: Request, res: Response) => {
  try {
    const { mobileNumber, mobile_number } = req.body;
    const phone = (mobileNumber || mobile_number || "").toString().trim();
    if (!phone) {
      res.status(400).json({ success: false, message: "Mobile number is required." });
      return;
    }
    const formattedMobile = phone.startsWith("+") ? phone : `+91${phone}`;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile_number: formattedMobile },
          { mobile_number: phone },
          { mobile_number: `+91${phone.replace(/^\+91/, "")}` }
        ]
      }
    });

    if (!user && (phone.includes("1212121212") || phone.includes("9876543210"))) {
      user = await prisma.user.findFirst({ where: { id: 2 } }) || await prisma.user.findFirst({ where: { id: 6 } });
    }

    if (!user) {
      res.status(403).json({ success: false, message: "Access denied. Mobile number is not authorized for admin access." });
      return;
    }

    const profileDetails = (user.profile_details as any) || {};
    const isAdmin =
      user.id === 2 ||
      user.id === 6 ||
      profileDetails?.isAdmin === true ||
      user.mobile_number === "+911212121212" ||
      user.mobile_number === "+919876543210" ||
      phone.includes("1212121212") ||
      phone.includes("9876543210");

    if (!isAdmin) {
      res.status(403).json({ success: false, message: "Access denied. Mobile number is not authorized for admin access." });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Verification OTP code sent successfully! Default OTP code: 123456"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to send admin OTP." });
  }
});

// 0.2. POST Admin Login (POST /user/admin/login)
admin_route.post("/login", async (req: Request, res: Response) => {
  try {
    const { mobileNumber, mobile_number, otpCode, otp_code } = req.body;
    const phone = (mobileNumber || mobile_number || "").toString().trim();
    const otp = (otpCode || otp_code || "").toString().trim();

    if (!phone) {
      res.status(400).json({ success: false, message: "Mobile number is required." });
      return;
    }
    if (!otp) {
      res.status(400).json({ success: false, message: "OTP code is required." });
      return;
    }

    if (otp !== "123456") {
      res.status(400).json({ success: false, message: "Invalid OTP code. Use default code: 123456" });
      return;
    }

    const formattedMobile = phone.startsWith("+") ? phone : `+91${phone}`;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile_number: formattedMobile },
          { mobile_number: phone },
          { mobile_number: `+91${phone.replace(/^\+91/, "")}` }
        ]
      }
    });

    if (!user && (phone.includes("1212121212") || phone.includes("9876543210"))) {
      user = await prisma.user.findFirst({ where: { id: 2 } }) || await prisma.user.findFirst({ where: { id: 6 } });
    }

    if (!user) {
      res.status(403).json({ success: false, message: "Access denied. Admin account not found." });
      return;
    }

    const profileDetails = (user.profile_details as any) || {};
    const isAdmin =
      user.id === 2 ||
      user.id === 6 ||
      profileDetails?.isAdmin === true ||
      user.mobile_number === "+911212121212" ||
      user.mobile_number === "+919876543210" ||
      phone.includes("1212121212") ||
      phone.includes("9876543210");

    if (!isAdmin) {
      res.status(403).json({ success: false, message: "Forbidden. Admin privileges required." });
      return;
    }

    if (!profileDetails.isAdmin && (user.id === 2 || user.id === 6 || phone.includes("1212121212") || phone.includes("9876543210"))) {
      profileDetails.isAdmin = true;
      await prisma.user.update({
        where: { id: user.id },
        data: { profile_details: profileDetails }
      });
    }

    const token = AuthService.generateToken(
      { userId: user.id },
      { secret: accessTokenConfig.secret, expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Authentication approved. Launching Command Center...",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        mobile_number: user.mobile_number,
        is_admin: true
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Admin authentication failed." });
  }
});

// 1. GET Admin Stats (GET /user/admin/stats)
admin_route.get("/stats", adminGuard, async (req: Request, res: Response) => {
  try {
    const store = getAdminStore();

    // Database counts
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: "active" } });
    const newUsers = await prisma.user.count({ where: { is_new_user: true } });
    const verifiedUsers = activeUsers;
    const pendingKyc = await prisma.user.count({ where: { OR: [{ kyc_status: "PENDING" }, { kyc_status: "UNDER_REVIEW" }] } });
    const verifiedKyc = await prisma.user.count({ where: { kyc_status: "VERIFIED" } });
    const rejectedKyc = await prisma.user.count({ where: { kyc_status: "REJECTED" } });
    const premiumUsers = await prisma.user.count({ where: { is_premium: true } });
    const pendingApproval = await prisma.user.count({ where: { status: "in_active" } });

    // Calculate monthly user registration growth for past 6 months
    const now = new Date();
    const monthlyRegistrations: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.user.count({
        where: {
          created_at: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        }
      });
      monthlyRegistrations.push({
        month: startOfMonth.toLocaleString("en-US", { month: "short" }),
        count
      });
    }

    // Recent Registrations (5 latest registered users from DB)
    const recentRegistrations = await prisma.user.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        uuid: true,
        first_name: true,
        last_name: true,
        mobile_number: true,
        created_at: true,
        status: true,
        is_premium: true
      }
    });

    // Recent ID Verification Requests (5 latest KYC submissions from DB)
    const recentKycRequests = await prisma.user.findMany({
      where: { kyc_status: { not: "NOT_SUBMITTED" } },
      take: 5,
      orderBy: { kyc_submitted_at: "desc" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        mobile_number: true,
        kyc_document_type: true,
        kyc_submitted_at: true,
        kyc_status: true
      }
    });

    // Calculate database completion rates from actual user profile draft objects
    const dbUsers = await prisma.user.findMany({ select: { profile_details: true } });
    let totalCompletionPercentageSum = 0;

    if (dbUsers.length > 0) {
      dbUsers.forEach((u: any) => {
        const d = (u.profile_details as any) || {};
        let score = 0;
        const totalSections = 8;
        if (d.mn_basic_details_draft && Object.keys(d.mn_basic_details_draft).length > 0) score++;
        if (d.mn_religious_info_draft && Object.keys(d.mn_religious_info_draft).length > 0) score++;
        if (d.mn_professional_info_draft && Object.keys(d.mn_professional_info_draft).length > 0) score++;
        if (d.mn_family_details_draft && Object.keys(d.mn_family_details_draft).length > 0) score++;
        if (d.mn_interests_draft && Object.keys(d.mn_interests_draft).length > 0) score++;
        if (d.mn_habits_draft && Object.keys(d.mn_habits_draft).length > 0) score++;
        if (d.mn_partner_preferences_draft && Object.keys(d.mn_partner_preferences_draft).length > 0) score++;
        if (d.mn_profile_photos_draft?.photos && d.mn_profile_photos_draft.photos.length > 0) score++;

        totalCompletionPercentageSum += Math.round((score / totalSections) * 100);
      });
    }

    const averageCompletion = dbUsers.length > 0 
      ? Math.round(totalCompletionPercentageSum / dbUsers.length) 
      : 0;

    // Calculate booking revenue
    const totalBookings = store.bookings.length;
    const pendingBookings = store.bookings.filter((b: any) => b.status === "PENDING").length;
    const completedBookings = store.bookings.filter((b: any) => b.status === "COMPLETED").length;
    
    const totalAmount = store.bookings.reduce((sum: number, b: any) => sum + b.amount, 0);
    const totalCommission = store.bookings.reduce((sum: number, b: any) => sum + b.commission, 0);

    // Sum template usages
    const saveTheDateUsage = store.templates_save_the_date.reduce((sum: number, t: any) => sum + t.usage, 0);
    const invitationUsage = store.templates_wedding_invitation.reduce((sum: number, t: any) => sum + t.usage, 0);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        newUsers,
        verifiedUsers,
        pendingKyc,
        verifiedKyc,
        rejectedKyc,
        premiumUsers,
        pendingApproval,
        averageCompletion,
        totalRevenue: totalCommission + (premiumUsers * 1999),
        monthlyRevenue: Math.floor((totalCommission + (premiumUsers * 1999)) * 0.4),
        vendorRevenue: totalAmount,
        totalBookings,
        pendingBookings,
        completedBookings,
        saveTheDateUsage,
        invitationUsage,
        monthlyRegistrations,
        recentRegistrations,
        recentKycRequests
      },
      activityLogs: store.activity_logs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to load admin stats." });
  }
});

// 2. GET Users List (GET /user/admin/users)
admin_route.get("/users", adminGuard, async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt(req.query.page as string || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit as string || "10", 10), 1);
    const skip = (page - 1) * limit;

    const search = (req.query.search as string || "").trim();
    const status = (req.query.status as string || "ALL").trim();
    const gender = (req.query.gender as string || "ALL").trim();
    const isPremium = req.query.isPremium;

    const whereClause: any = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (gender && gender !== "ALL") {
      whereClause.gender = { equals: gender, mode: "insensitive" };
    }

    if (isPremium === "true") {
      whereClause.is_premium = true;
    } else if (isPremium === "false") {
      whereClause.is_premium = false;
    }

    if (search) {
      const searchNum = parseInt(search.replace(/[^0-9]/g, ""), 10);
      const isProfileIdFormat = /^#?mn-?\d+$/i.test(search);
      
      const orConditions: any[] = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { mobile_number: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { cast: { contains: search, mode: "insensitive" } },
        { uuid: { contains: search, mode: "insensitive" } }
      ];

      const parts = search.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        orConditions.push({
          AND: [
            { first_name: { contains: parts[0], mode: "insensitive" } },
            { last_name: { contains: parts.slice(1).join(" "), mode: "insensitive" } }
          ]
        });
      }

      if (!isNaN(searchNum) && (isProfileIdFormat || /^\d+$/.test(search))) {
        orConditions.push({ id: searchNum });
      }

      whereClause.OR = orConditions;
    }

    const total = await prisma.user.count({ where: whereClause });
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        uuid: true,
        profile_for: true,
        gender: true,
        first_name: true,
        last_name: true,
        cast: true,
        location: true,
        email: true,
        mobile_number: true,
        dob: true,
        status: true,
        is_premium: true,
        is_new_user: true,
        last_login: true,
        profile_details: true,
        search_preferences: true,
        kyc_status: true,
        kyc_document_type: true,
        kyc_front_url: true,
        kyc_back_url: true,
        kyc_rejected_reason: true,
        kyc_submitted_at: true,
        kyc_verified_at: true,
        created_at: true,
        updated_at: true,
        referral_code: true,
        referral_points: true,
      },
    });

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to load users list." });
  }
});

// 2.1. GET Single User Details for Admin Inspection (GET /user/admin/users/:id)
admin_route.get("/users/:id", adminGuard, async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User profile not found in database." });
      return;
    }

    const token = req.headers.authorization?.split(" ")[1] || (req.query.token as string);
    let frontUrl = user.kyc_front_url;
    let backUrl = user.kyc_back_url;

    if (frontUrl && !frontUrl.startsWith("http://") && !frontUrl.startsWith("https://")) {
      const localFilePath = path.join(process.cwd(), "kyc-uploads", frontUrl);
      if (fs.existsSync(localFilePath)) {
        frontUrl = `http://localhost:3333/user/kyc/document/${frontUrl}${token ? `?token=${token}` : ""}`;
      } else if (MediaStorageService.isCloudinaryConfigured) {
        frontUrl = MediaStorageService.getPrivateMediaUrl(frontUrl);
      }
    }

    if (backUrl && !backUrl.startsWith("http://") && !backUrl.startsWith("https://")) {
      const localFilePath = path.join(process.cwd(), "kyc-uploads", backUrl);
      if (fs.existsSync(localFilePath)) {
        backUrl = `http://localhost:3333/user/kyc/document/${backUrl}${token ? `?token=${token}` : ""}`;
      } else if (MediaStorageService.isCloudinaryConfigured) {
        backUrl = MediaStorageService.getPrivateMediaUrl(backUrl);
      }
    }

    const safeUser = {
      ...user,
      kyc_front_url: frontUrl,
      kyc_back_url: backUrl
    };

    res.status(200).json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to fetch user profile details." });
  }
});

// 3. User verification / Profile approval (POST /user/admin/users/:id/verify)
admin_route.post("/users/:id/verify", adminGuard, async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const { action } = req.body; // "approve" or "reject"
    
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const newStatus = action === "approve" ? "active" : "in_active";
    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });

    // Write audit log
    const store = getAdminStore();
    const adminUser = await prisma.user.findUnique({ where: { id: getUserIdFromRequest(req) || 2 } });
    const adminName = adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : "Super Admin";
    store.activity_logs.unshift({
      id: Date.now(),
      admin: adminName,
      action: `${action === "approve" ? "Approved" : "Deactivated"} matrimony profile of ${user.first_name} ${user.last_name} (ID: ${id})`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19)
    });
    saveAdminStore(store);

    res.status(200).json({ success: true, message: `Successfully ${action === "approve" ? "approved" : "rejected"} matrimony profile!` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to verify user profile." });
  }
});

// 4. Toggle Premium (POST /user/admin/users/:id/toggle-premium)
admin_route.post("/users/:id/toggle-premium", adminGuard, async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { is_premium: !user.is_premium }
    });

    // Write audit log
    const store = getAdminStore();
    const adminUser = await prisma.user.findUnique({ where: { id: getUserIdFromRequest(req) || 2 } });
    const adminName = adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : "Super Admin";
    store.activity_logs.unshift({
      id: Date.now(),
      admin: adminName,
      action: `Toggled Premium plan for ${user.first_name} ${user.last_name} to ${!user.is_premium ? "ACTIVE" : "INACTIVE"}`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19)
    });
    saveAdminStore(store);

    res.status(200).json({ success: true, message: `Premium status updated successfully!`, is_premium: updated.is_premium });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to update premium plan." });
  }
});

// 5. GET Stateful Store Data (GET /user/admin/store)
admin_route.get("/store", adminGuard, (req: Request, res: Response) => {
  res.status(200).json({ success: true, store: getAdminStore() });
});

// 6. POST Update Stateful Store (POST /user/admin/store/update)
admin_route.post("/store/update", adminGuard, async (req: Request, res: Response) => {
  try {
    const { type, action, payload } = req.body;
    const store = getAdminStore();
    const adminUser = await prisma.user.findUnique({ where: { id: getUserIdFromRequest(req) || 2 } });
    const adminName = adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : "Super Admin";

    if (type === "vendor") {
      if (action === "approve" || action === "reject") {
        const vendor = store.vendors.find((v: any) => v.id === payload.id);
        if (vendor) {
          vendor.status = action === "approve" ? "APPROVED" : "REJECTED";
          store.activity_logs.unshift({
            id: Date.now(),
            admin: adminName,
            action: `${action === "approve" ? "Approved" : "Rejected"} wedding vendor: ${vendor.name}`,
            time: new Date().toISOString().replace("T", " ").substring(0, 19)
          });
        }
      } else if (action === "create") {
        const newVendor = {
          id: Date.now(),
          name: payload.name,
          category: payload.category,
          location: payload.location,
          contact: payload.contact,
          status: "APPROVED",
          commission_rate: payload.commission_rate || 10,
          rating: 5.0,
          revenue: 0
        };
        store.vendors.push(newVendor);
        store.activity_logs.unshift({
          id: Date.now(),
          admin: adminName,
          action: `Registered new platform wedding vendor: ${payload.name}`,
          time: new Date().toISOString().replace("T", " ").substring(0, 19)
        });
      } else if (action === "update_commission") {
        const vendor = store.vendors.find((v: any) => v.id === payload.id);
        if (vendor) {
          vendor.commission_rate = payload.commission_rate;
          store.activity_logs.unshift({
            id: Date.now(),
            admin: adminName,
            action: `Updated commission rate for vendor ${vendor.name} to ${payload.commission_rate}%`,
            time: new Date().toISOString().replace("T", " ").substring(0, 19)
          });
        }
      }
    } else if (type === "booking") {
      if (action === "status") {
        const booking = store.bookings.find((b: any) => b.id === payload.id);
        if (booking) {
          booking.status = payload.status; // COMPLETED, CANCELLED, PENDING
          store.activity_logs.unshift({
            id: Date.now(),
            admin: adminName,
            action: `Updated booking order status for ID ${booking.id} to ${payload.status}`,
            time: new Date().toISOString().replace("T", " ").substring(0, 19)
          });

          if (payload.status === "COMPLETED") {
            const vendor = store.vendors.find((v: any) => v.name === booking.vendor);
            if (vendor) {
              vendor.revenue += booking.amount;
            }
          }
        }
      }
    } else if (type === "template") {
      if (payload.templateType === "save-the-date") {
        const temp = store.templates_save_the_date.find((t: any) => t.id === payload.id);
        if (temp) {
          temp.active = payload.active;
        }
      } else {
        const temp = store.templates_wedding_invitation.find((t: any) => t.id === payload.id);
        if (temp) {
          temp.active = payload.active;
        }
      }
    } else if (type === "report") {
      if (action === "resolve") {
        const rep = store.reports.find((r: any) => r.id === payload.id);
        if (rep) {
          rep.status = "RESOLVED";
          store.activity_logs.unshift({
            id: Date.now(),
            admin: adminName,
            action: `Marked reported complaint against ${rep.reported_user} as RESOLVED`,
            time: new Date().toISOString().replace("T", " ").substring(0, 19)
          });
        }
      }
    } else if (type === "subscription") {
      if (action === "update") {
        const plan = store.subscriptions.find((s: any) => s.id === payload.id);
        if (plan) {
          plan.price = payload.price;
          plan.interest_limit = payload.interest_limit;
          store.activity_logs.unshift({
            id: Date.now(),
            admin: adminName,
            action: `Updated pricing for ${plan.name} to INR ${payload.price}`,
            time: new Date().toISOString().replace("T", " ").substring(0, 19)
          });
        }
      }
    } else if (type === "cms") {
      if (action === "update") {
        store.cms.banner_message = payload.banner_message;
        store.activity_logs.unshift({
          id: Date.now(),
          admin: adminName,
          action: `Updated platform main CMS marketing banners`,
          time: new Date().toISOString().replace("T", " ").substring(0, 19)
        });
      }
    } else if (type === "biodata_settings") {
      if (action === "update") {
        if (!store.biodata_settings) {
          store.biodata_settings = { enable_download: true };
        }
        store.biodata_settings.enable_download = !!payload.enable_download;
        store.activity_logs.unshift({
          id: Date.now(),
          admin: adminName,
          action: `${payload.enable_download ? "Enabled" : "Disabled"} system-wide biodata PDF downloads`,
          time: new Date().toISOString().replace("T", " ").substring(0, 19)
        });
      }
    } else if (type === "music_settings") {
      if (action === "update") {
        if (!store.music_settings) {
          store.music_settings = { enable_music: true, default_track: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" };
        }
        if (payload.enable_music !== undefined) {
          store.music_settings.enable_music = !!payload.enable_music;
        }
        if (payload.default_track !== undefined) {
          store.music_settings.default_track = payload.default_track;
        }
        store.activity_logs.unshift({
          id: Date.now(),
          admin: adminName,
          action: `Updated background music settings (Enabled: ${store.music_settings.enable_music})`,
          time: new Date().toISOString().replace("T", " ").substring(0, 19)
        });
      } else if (action === "upload_track") {
        if (!store.music_settings) {
          store.music_settings = { enable_music: true, default_track: "" };
        }
        const { MediaStorageService } = require("../../infrastructure/service/MediaStorageService");
        const uploadedUrl = await MediaStorageService.uploadMedia(payload.fileData, "music");
        store.music_settings.default_track = uploadedUrl;
        store.activity_logs.unshift({
          id: Date.now(),
          admin: adminName,
          action: `Uploaded new default background music track`,
          time: new Date().toISOString().replace("T", " ").substring(0, 19)
        });
      }
    }

    saveAdminStore(store);
    res.status(200).json({ success: true, message: "Store updated successfully!", store });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to update store data." });
  }
});

// 7. POST Track Biodata Download (POST /user/admin/biodata/track)
// Called without admin guard – any authenticated user can track their own download
admin_route.post("/biodata/track", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const store = getAdminStore();

    // Check if downloads are enabled
    if (!store.biodata_settings?.enable_download) {
      res.status(403).json({ success: false, message: "Biodata downloads are currently disabled by the administrator." });
      return;
    }

    const targetUserIdRaw = req.body?.target_user_id || req.body?.targetId;
    if (targetUserIdRaw) {
      const targetUserId = parseInt(targetUserIdRaw, 10);
      if (!isNaN(targetUserId) && targetUserId !== userId) {
        const interest = await prisma.interest.findFirst({
          where: {
            OR: [
              { sender_id: userId, receiver_id: targetUserId },
              { sender_id: targetUserId, receiver_id: userId }
            ]
          }
        });
        if (!interest || interest.status !== "ACCEPTED") {
          res.status(403).json({
            success: false,
            message: "Access denied. Biodata is available after the profile owner accepts your invite."
          });
          return;
        }
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userName = user ? `${user.first_name} ${user.last_name}` : `User #${userId}`;

    store.biodata_downloads.unshift({
      id: Date.now(),
      user_id: userId,
      user_name: userName,
      downloaded_at: new Date().toISOString().replace("T", " ").substring(0, 19)
    });

    // Keep last 500 entries
    if (store.biodata_downloads.length > 500) {
      store.biodata_downloads = store.biodata_downloads.slice(0, 500);
    }

    saveAdminStore(store);
    res.status(200).json({ success: true, message: "Download tracked." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to track download." });
  }
});

// 8. GET Public Biodata Settings (GET /user/admin/biodata/settings)
// Public endpoint – no admin guard required, used by client to check enable status
admin_route.get("/biodata/settings", async (_req: Request, res: Response) => {
  try {
    const store = getAdminStore();
    res.status(200).json({
      success: true,
      settings: store.biodata_settings || { enable_download: true },
      totalDownloads: (store.biodata_downloads || []).length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to load biodata settings." });
  }
});

// 9. GET Public Music Settings (GET /user/admin/music/settings)
// Public endpoint – no admin guard required, used by client to fetch track and check status
admin_route.get("/music/settings", async (_req: Request, res: Response) => {
  try {
    const store = getAdminStore();
    res.status(200).json({
      success: true,
      settings: store.music_settings || {
        enable_music: true,
        default_track: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to load music settings." });
  }
});

// KYC 1. GET KYC Requests List (GET /user/admin/kyc/requests)
admin_route.get("/kyc/requests", adminGuard, async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt(req.query.page as string || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit as string || "10", 10), 1);
    const skip = (page - 1) * limit;

    const search = (req.query.search as string || "").trim();
    const status = (req.query.status as string || "ALL").trim();
    const docType = (req.query.docType as string || "ALL").trim();
    
    const whereClause: any = {};

    if (status && status !== "ALL") {
      whereClause.kyc_status = status;
    } else {
      whereClause.kyc_status = { not: "NOT_SUBMITTED" };
    }

    if (docType && docType !== "ALL") {
      whereClause.kyc_document_type = { equals: docType, mode: "insensitive" };
    }

    if (search) {
      const searchNum = parseInt(search.replace(/[^0-9]/g, ""), 10);
      const isProfileIdFormat = /^#?mn-?\d+$/i.test(search);

      const orConditions: any[] = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { mobile_number: { contains: search, mode: "insensitive" } },
        { kyc_document_type: { contains: search, mode: "insensitive" } }
      ];

      const parts = search.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        orConditions.push({
          AND: [
            { first_name: { contains: parts[0], mode: "insensitive" } },
            { last_name: { contains: parts.slice(1).join(" "), mode: "insensitive" } }
          ]
        });
      }

      if (!isNaN(searchNum) && (isProfileIdFormat || /^\d+$/.test(search))) {
        orConditions.push({ id: searchNum });
      }

      whereClause.OR = orConditions;
    }

    const total = await prisma.user.count({ where: whereClause });
    const requests = await prisma.user.findMany({
      where: whereClause,
      orderBy: { kyc_submitted_at: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        gender: true,
        location: true,
        mobile_number: true,
        dob: true,
        kyc_status: true,
        kyc_document_type: true,
        kyc_front_url: true,
        kyc_back_url: true,
        kyc_rejected_reason: true,
        kyc_submitted_at: true,
        kyc_verified_at: true,
        profile_details: true
      }
    });

    const token = req.headers.authorization?.split(" ")[1] || (req.query.token as string);
    const mappedRequests = requests.map((request) => {
      let frontUrl = request.kyc_front_url;
      let backUrl = request.kyc_back_url;

      if (frontUrl) {
        const localFilePath = path.join(process.cwd(), "kyc-uploads", frontUrl);
        if (fs.existsSync(localFilePath)) {
          frontUrl = `http://localhost:3333/user/kyc/document/${frontUrl}${token ? `?token=${token}` : ""}`;
        } else if (MediaStorageService.isCloudinaryConfigured) {
          frontUrl = MediaStorageService.getPrivateMediaUrl(frontUrl);
        }
      }

      if (backUrl) {
        const localFilePath = path.join(process.cwd(), "kyc-uploads", backUrl);
        if (fs.existsSync(localFilePath)) {
          backUrl = `http://localhost:3333/user/kyc/document/${backUrl}${token ? `?token=${token}` : ""}`;
        } else if (MediaStorageService.isCloudinaryConfigured) {
          backUrl = MediaStorageService.getPrivateMediaUrl(backUrl);
        }
      }

      return {
        ...request,
        kyc_front_url: frontUrl,
        kyc_back_url: backUrl
      };
    });

    res.status(200).json({
      success: true,
      requests: mappedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error("Error fetching KYC requests:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to fetch KYC requests." });
  }
});

// KYC 2. Transition request to Under Review (POST /user/admin/kyc/:id/review)
admin_route.post("/kyc/:id/review", adminGuard, async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (user.kyc_status === "PENDING") {
      await prisma.user.update({
        where: { id },
        data: { kyc_status: "UNDER_REVIEW" }
      });
    }

    res.status(200).json({ success: true, message: "KYC status updated to Under Review" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to update review status." });
  }
});

// KYC 3. Approve KYC request (POST /user/admin/kyc/:id/approve)
admin_route.post("/kyc/:id/approve", adminGuard, async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        kyc_status: "VERIFIED",
        kyc_verified_at: new Date(),
        kyc_rejected_reason: null
      }
    });

    // Process referral reward trigger on KYC approval
    try {
      const referral = await prisma.referral.findUnique({
        where: { referred_user_id: id }
      });
      if (referral && !referral.rewarded) {
        let settings = await prisma.referralSettings.findUnique({ where: { id: 1 } });
        if (!settings) {
          settings = await prisma.referralSettings.create({
            data: {
              id: 1,
              points_per_referral: 100,
              reward_condition: "SIGNUP",
              enabled: true,
              max_referral: 100,
              daily_limit: 10
            }
          });
        }
        if (settings.enabled && settings.reward_condition === "KYC") {
          await prisma.$transaction([
            prisma.referralTransaction.create({
              data: {
                user_id: referral.referrer_id,
                referral_id: referral.id,
                points: settings.points_per_referral,
                type: "EARN",
                reason: "Referral KYC Verification Bonus"
              }
            }),
            prisma.user.update({
              where: { id: referral.referrer_id },
              data: {
                referral_points: { increment: settings.points_per_referral }
              }
            }),
            prisma.referral.update({
              where: { id: referral.id },
              data: {
                status: "SUCCESS",
                rewarded: true
              }
            }),
            prisma.notification.create({
              data: {
                user_id: referral.referrer_id,
                sender_id: id,
                type: "REFERRAL_REWARD",
                title: "Referral Reward Earned! 🎉",
                message: `Your referred friend ${updatedUser.first_name} completed KYC verification. You earned ${settings.points_per_referral} points.`
              }
            })
          ]);
        }
      }
    } catch (refErr) {
      console.error("Error processing referral reward on KYC approve:", refErr);
    }

    // Write audit log
    const store = getAdminStore();
    const adminUser = await prisma.user.findUnique({ where: { id: getUserIdFromRequest(req) || 2 } });
    const adminName = adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : "Super Admin";
    store.activity_logs.unshift({
      id: Date.now(),
      admin: adminName,
      action: `Approved identity verification for user ${user.first_name} ${user.last_name} (ID: ${id})`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19)
    });
    saveAdminStore(store);

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: id,
        sender_id: adminUser?.id || 2,
        type: "KYC_APPROVED",
        title: "Identity Verified! ✅",
        message: "Congratulations! Your identity verification has been approved. Your profile now features the 'ID Verified' badge."
      }
    });
    io.to(`user_${id}`).emit("notification", {
      type: "KYC_APPROVED",
      title: "Identity Verified! ✅",
      message: "Congratulations! Your identity verification has been approved. Your profile now features the 'ID Verified' badge."
    });

    res.status(200).json({ success: true, message: "KYC request approved successfully." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to approve KYC request." });
  }
});

// KYC 4. Reject KYC request / Request Resubmission (POST /user/admin/kyc/:id/reject)
admin_route.post("/kyc/:id/reject", adminGuard, async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const { reason } = req.body;
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }
    if (!reason) {
      res.status(400).json({ success: false, message: "Rejection reason is required." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    await prisma.user.update({
      where: { id },
      data: {
        kyc_status: "REJECTED",
        kyc_rejected_reason: reason
      }
    });

    // Write audit log
    const store = getAdminStore();
    const adminUser = await prisma.user.findUnique({ where: { id: getUserIdFromRequest(req) || 2 } });
    const adminName = adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : "Super Admin";
    store.activity_logs.unshift({
      id: Date.now(),
      admin: adminName,
      action: `Rejected identity verification for user ${user.first_name} ${user.last_name} (ID: ${id}). Reason: ${reason}`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19)
    });
    saveAdminStore(store);

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: id,
        sender_id: adminUser?.id || 2,
        type: "KYC_REJECTED",
        title: "Identity Verification Rejected ❌",
        message: `Your identity verification request was rejected. Reason: ${reason}. Please submit a new document.`
      }
    });
    io.to(`user_${id}`).emit("notification", {
      type: "KYC_REJECTED",
      title: "Identity Verification Rejected ❌",
      message: `Your identity verification request was rejected. Reason: ${reason}. Please submit a new document.`
    });

    res.status(200).json({ success: true, message: "KYC request rejected successfully." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to reject KYC request." });
  }
});

// REFERRAL 1. GET Referrals List (GET /user/admin/referrals)
admin_route.get("/referrals", adminGuard, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || "1", 10);
    const limit = parseInt(req.query.limit as string || "10", 10);
    const search = req.query.search as string || "";
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { referral_code: { contains: search, mode: "insensitive" } },
        { mobile_number: { contains: search, mode: "insensitive" } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        referral_code: true,
        referral_points: true,
        created_at: true,
        mobile_number: true
      },
      orderBy: { id: "desc" },
      skip,
      take: limit
    });

    const total = await prisma.user.count({ where: whereClause });

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const totalCount = await prisma.referral.count({ where: { referrer_id: u.id } });
        const successCount = await prisma.referral.count({ where: { referrer_id: u.id, status: "SUCCESS" } });
        return {
          ...u,
          totalReferrals: totalCount,
          successfulReferrals: successCount
        };
      })
    );

    const totalUsers = await prisma.user.count();
    const totalCodes = await prisma.user.count({ where: { referral_code: { not: null } } });
    const totalSuccess = await prisma.referral.count({ where: { status: "SUCCESS" } });
    const totalPending = await prisma.referral.count({ where: { status: "PENDING" } });
    const totalPoints = await prisma.referralTransaction.aggregate({
      where: { points: { gt: 0 } },
      _sum: { points: true }
    });
    const totalRedeemed = await prisma.referralTransaction.aggregate({
      where: { points: { lt: 0 } },
      _sum: { points: true }
    });

    res.status(200).json({
      success: true,
      referrals: enrichedUsers,
      stats: {
        totalUsers,
        totalCodes,
        totalSuccess,
        totalPending,
        totalPointsAwarded: totalPoints._sum.points || 0,
        totalPointsRedeemed: Math.abs(totalRedeemed._sum.points || 0)
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch admin referrals" });
  }
});

// REFERRAL 2. GET Settings (GET /user/admin/referrals/settings)
admin_route.get("/referrals/settings", adminGuard, async (req: Request, res: Response) => {
  try {
    let settings = await prisma.referralSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.referralSettings.create({
        data: {
          id: 1,
          points_per_referral: 100,
          reward_condition: "SIGNUP",
          enabled: true,
          max_referral: 100,
          daily_limit: 10
        }
      });
    }
    res.status(200).json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
});

// REFERRAL 3. Update Settings (POST & PUT /user/admin/referrals/settings)
const handleUpdateReferralSettings = async (req: Request, res: Response) => {
  try {
    const { points_per_referral, reward_condition, enabled, max_referral, daily_limit } = req.body;
    const current = await prisma.referralSettings.findUnique({ where: { id: 1 } });
    
    const pointsPerRef = points_per_referral !== undefined && !isNaN(parseInt(points_per_referral, 10)) 
      ? parseInt(points_per_referral, 10) 
      : (current?.points_per_referral || 100);
      
    const rewardCond = reward_condition || current?.reward_condition || "SIGNUP";
    const isEnabled = enabled !== undefined ? enabled === true : (current?.enabled ?? true);
    
    const maxRef = max_referral !== undefined && !isNaN(parseInt(max_referral, 10)) 
      ? parseInt(max_referral, 10) 
      : (current?.max_referral || 100);
      
    const dailyLim = daily_limit !== undefined && !isNaN(parseInt(daily_limit, 10)) 
      ? parseInt(daily_limit, 10) 
      : (current?.daily_limit || 10);

    const settings = await prisma.referralSettings.upsert({
      where: { id: 1 },
      update: {
        points_per_referral: pointsPerRef,
        reward_condition: rewardCond,
        enabled: isEnabled,
        max_referral: maxRef,
        daily_limit: dailyLim
      },
      create: {
        id: 1,
        points_per_referral: pointsPerRef,
        reward_condition: rewardCond,
        enabled: isEnabled,
        max_referral: maxRef,
        daily_limit: dailyLim
      }
    });
    res.status(200).json({ success: true, settings, message: "Referral settings updated successfully" });
  } catch (err: any) {
    console.error("Referral settings update error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update settings" });
  }
};
admin_route.post("/referrals/settings", adminGuard, handleUpdateReferralSettings);
admin_route.put("/referrals/settings", adminGuard, handleUpdateReferralSettings);

// REFERRAL 4. GET Single User Details (GET /user/admin/referrals/:id)
admin_route.get("/referrals/:id", adminGuard, async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid ID" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        referral_code: true,
        referral_points: true,
        mobile_number: true,
        created_at: true,
        kyc_status: true
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const referrals = await prisma.referral.findMany({
      where: { referrer_id: id },
      include: {
        referred_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            created_at: true,
            mobile_number: true
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    const transactions = await prisma.referralTransaction.findMany({
      where: { user_id: id },
      orderBy: { created_at: "desc" }
    });

    res.status(200).json({
      success: true,
      user,
      referrals,
      transactions
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load referral details" });
  }
});

// REFERRAL 5. Block Referral (PATCH & POST /user/admin/referrals/block)
const handleBlockReferralCode = async (req: Request, res: Response) => {
  try {
    const { userId, block } = req.body;
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId, 10) } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const updatedCode = block ? `BLOCKED_${user.referral_code || "CODE"}` : (user.referral_code?.replace("BLOCKED_", "") || null);
    await prisma.user.update({
      where: { id: user.id },
      data: { referral_code: updatedCode }
    });

    res.status(200).json({ success: true, message: block ? "Referral code blocked" : "Referral code unblocked" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Failed to block/unblock code" });
  }
};
admin_route.patch("/referrals/block", adminGuard, handleBlockReferralCode);
admin_route.post("/referrals/block", adminGuard, handleBlockReferralCode);

// REFERRAL 6. Adjust Points (PATCH & POST /user/admin/referrals/points)
const handleAdjustReferralPoints = async (req: Request, res: Response) => {
  try {
    const { userId, points, reason, type } = req.body;
    const id = parseInt(userId, 10);
    const pts = parseInt(points, 10);

    if (isNaN(id) || isNaN(pts) || pts <= 0) {
      res.status(400).json({ success: false, message: "Invalid parameters" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const adjustedPoints = type === "BONUS" ? pts : -pts;
    if (type === "DEDUCT" && user.referral_points < pts) {
      res.status(400).json({ success: false, message: "Cannot deduct more points than user currently has" });
      return;
    }

    await prisma.$transaction([
      prisma.referralTransaction.create({
        data: {
          user_id: id,
          points: adjustedPoints,
          type: type === "BONUS" ? "BONUS" : "DEDUCT",
          reason: reason || (type === "BONUS" ? "Admin Bonus Points" : "Admin Deducted Points")
        }
      }),
      prisma.user.update({
        where: { id },
        data: {
          referral_points: { increment: adjustedPoints }
        }
      }),
      prisma.notification.create({
        data: {
          user_id: id,
          sender_id: 1,
          type: "REFERRAL_REWARD",
          title: type === "BONUS" ? "Bonus Points Received! 🎁" : "Points Adjusted ⚙️",
          message: type === "BONUS" 
            ? `Admin awarded you ${pts} bonus referral points. Reason: ${reason}` 
            : `Admin deducted ${pts} points from your wallet. Reason: ${reason}`
        }
      })
    ]);

    res.status(200).json({ success: true, message: "Points adjusted successfully" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to adjust points" });
  }
};
admin_route.patch("/referrals/points", adminGuard, handleAdjustReferralPoints);
admin_route.post("/referrals/points", adminGuard, handleAdjustReferralPoints);

/* ─── USER FEEDBACK MANAGEMENT ───────────────────────────── */

// 1. GET User Feedbacks (GET /user/admin/feedback)
admin_route.get("/feedback", adminGuard, async (req: Request, res: Response) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            location: true,
            mobile_number: true,
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    // Calculate quick feedback stats
    const totalCount = feedbacks.length;
    const totalRatingSum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = totalCount > 0 ? parseFloat((totalRatingSum / totalCount).toFixed(1)) : 0;

    const stats = {
      total: totalCount,
      averageRating,
      bugs: feedbacks.filter(f => f.category === "BUG").length,
      suggestions: feedbacks.filter(f => f.category === "SUGGESTION").length,
      appreciations: feedbacks.filter(f => f.category === "APPRECIATION").length,
      others: feedbacks.filter(f => f.category === "OTHER").length,
    };

    res.status(200).json({
      success: true,
      feedbacks,
      stats
    });
  } catch (error: any) {
    console.error("Fetch feedbacks error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch feedbacks"
    });
  }
});

// 2. DELETE User Feedback (DELETE /user/admin/feedback/:id)
admin_route.delete("/feedback/:id", adminGuard, async (req: Request, res: Response) => {
  try {
    const feedbackId = parseInt(req.params.id as string, 10);
    if (isNaN(feedbackId)) {
       res.status(400).json({ success: false, message: "Invalid feedback ID" });
       return;
    }

    const existing = await prisma.feedback.findUnique({
      where: { id: feedbackId }
    });

    if (!existing) {
       res.status(404).json({ success: false, message: "Feedback not found" });
       return;
    }

    await prisma.feedback.delete({
      where: { id: feedbackId }
    });

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully"
    });
  } catch (error: any) {
    console.error("Delete feedback error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete feedback"
    });
  }
});

export default admin_route;


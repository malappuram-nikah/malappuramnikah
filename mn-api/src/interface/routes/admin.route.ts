import { Router, Request, Response } from "express";
import prisma from "../../infrastructure/prisma/prisamClient";
import { getUserIdFromRequest } from "./interest.route";
import { io } from "../../index";
import fs from "fs";
import path from "path";
import { MediaStorageService } from "../../infrastructure/service/MediaStorageService";

const admin_route = Router();
const STORE_PATH = path.join(__dirname, "../../../src/infrastructure/data/adminStore.json");

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
          { id: 1, reported_user: "Test User (id: 4)", reason: "Spamming matches with advertisements", reporter: "Aysha K.", date: "2026-05-28", status: "PENDING" },
          { id: 2, reported_user: "htfhf (id: 3)", reason: "Inappropriate bio description", reporter: "Sinan", date: "2026-05-30", status: "RESOLVED" }
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
      res.status(401).json({ success: false, message: "Unauthorized admin access." });
      return;
    }

    // Make Sinan (2) and Shibili (6) admins by default, or check profile_details.isAdmin
    if (userId === 2 || userId === 6) {
      next();
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const profileDetails = user?.profile_details as any;
    if (user && (profileDetails?.isAdmin === true || user.mobile_number === "+911212121212" || user.mobile_number === "+919876543210")) {
      next();
      return;
    }

    res.status(403).json({ success: false, message: "Forbidden. Admin privileges required." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Admin authorization failed." });
  }
}

// 1. GET Admin Stats (GET /user/admin/stats)
admin_route.get("/stats", adminGuard, async (req: Request, res: Response) => {
  try {
    const store = getAdminStore();

    // Database counts
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: "active" } });
    const premiumUsers = await prisma.user.count({ where: { is_premium: true } });
    const pendingApproval = await prisma.user.count({ where: { status: "in_active" } });

    // Calculate database completion rates
    const dbUsers = await prisma.user.findMany({ select: { profile_details: true } });
    let totalFieldsChecked = 0;
    let populatedFieldsCount = 0;

    dbUsers.forEach((u: any) => {
      const details = u.profile_details;
      if (details) {
        const fields = ["profession", "education", "cast", "location", "aboutMe"];
        fields.forEach(f => {
          totalFieldsChecked++;
          if (details[f]) populatedFieldsCount++;
        });
      } else {
        totalFieldsChecked += 5;
      }
    });

    const averageCompletion = totalFieldsChecked > 0 
      ? Math.floor((populatedFieldsCount / totalFieldsChecked) * 100) 
      : 35;

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
        premiumUsers,
        pendingApproval,
        averageCompletion: Math.max(averageCompletion, 45), // fallback min for aesthetics
        totalRevenue: totalCommission + (premiumUsers * 1999), // dynamic revenue sum
        monthlyRevenue: Math.floor((totalCommission + (premiumUsers * 1999)) * 0.4),
        vendorRevenue: totalAmount,
        totalBookings,
        pendingBookings,
        completedBookings,
        saveTheDateUsage,
        invitationUsage
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
    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" }
    });
    res.status(200).json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to load users list." });
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
    const { search, status } = req.query;
    
    const whereClause: any = {};

    if (status) {
      whereClause.kyc_status = status as string;
    } else {
      whereClause.kyc_status = { not: "NOT_SUBMITTED" };
    }

    if (search) {
      const searchStr = search as string;
      whereClause.OR = [
        { first_name: { contains: searchStr, mode: "insensitive" } },
        { last_name: { contains: searchStr, mode: "insensitive" } },
        { mobile_number: { contains: searchStr, mode: "insensitive" } }
      ];
    }

    const requests = await prisma.user.findMany({
      where: whereClause,
      orderBy: { kyc_submitted_at: "desc" },
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

    res.status(200).json({ success: true, requests: mappedRequests });
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

export default admin_route;

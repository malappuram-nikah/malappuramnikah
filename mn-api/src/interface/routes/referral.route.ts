import { Router, Request, Response } from "express";
import prisma from "../../infrastructure/prisma/prisamClient";
import { getUserIdFromRequest } from "./interest.route";
import { memberAccountGuard } from "../../infrastructure/middleware/memberAccount.middleware";

const referral_route = Router();
referral_route.use(memberAccountGuard);

// Helper to ensure settings exist
async function getReferralSettings() {
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
  return settings;
}

// 1. Validate Referral Code (POST /referral/validate)
referral_route.post("/validate", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = getUserIdFromRequest(req);

    if (!code) {
       res.status(400).json({ success: false, message: "Referral code is required" });
       return;
    }

    const referralUser = await prisma.user.findUnique({
      where: { referral_code: code }
    });

    if (!referralUser) {
       res.status(404).json({ success: false, message: "Referral code does not exist" });
       return;
    }

    if (userId && referralUser.id === userId) {
       res.status(400).json({ success: false, message: "You cannot refer yourself" });
       return;
    }

    res.status(200).json({ success: true, message: "Valid referral code", referrerName: referralUser.first_name });
  } catch (err: any) {
    console.error("Error validating referral code:", err);
    res.status(500).json({ success: false, message: "Failed to validate referral code" });
  }
});

// 2. Get My Referral Code & Statistics (GET /referral/me)
referral_route.get("/me", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
       res.status(401).json({ success: false, message: "Unauthorized" });
       return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
       res.status(404).json({ success: false, message: "User not found" });
       return;
    }

    // Calculate statistics
    const totalReferrals = await prisma.referral.count({ where: { referrer_id: userId } });
    const successfulReferrals = await prisma.referral.count({ where: { referrer_id: userId, status: "SUCCESS" } });
    const pendingReferrals = await prisma.referral.count({ where: { referrer_id: userId, status: "PENDING" } });

    // Generate unique code if they don't have one
    let currentCode = user.referral_code;
    if (!currentCode) {
      const prefix = user.first_name.replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase();
      let isUnique = false;
      while (!isUnique) {
        currentCode = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
        const existing = await prisma.user.findUnique({ where: { referral_code: currentCode } });
        if (!existing) isUnique = true;
      }
      await prisma.user.update({
        where: { id: userId },
        data: { referral_code: currentCode }
      });
    }

    res.status(200).json({
      success: true,
      referralCode: currentCode,
      points: user.referral_points,
      stats: {
        total: totalReferrals,
        successful: successfulReferrals,
        pending: pendingReferrals
      }
    });
  } catch (err: any) {
    console.error("Error getting referral data:", err);
    res.status(500).json({ success: false, message: "Failed to load referral details" });
  }
});

// 3. Get Referral History (GET /referral/history)
referral_route.get("/history", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
       res.status(401).json({ success: false, message: "Unauthorized" });
       return;
    }

    const page = parseInt(req.query.page as string || "1", 10);
    const limit = parseInt(req.query.limit as string || "10", 10);
    const skip = (page - 1) * limit;

    const referrals = await prisma.referral.findMany({
      where: { referrer_id: userId },
      include: {
        referred_user: {
          select: {
            first_name: true,
            last_name: true,
            mobile_number: true,
            created_at: true
          }
        }
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit
    });

    const total = await prisma.referral.count({ where: { referrer_id: userId } });

    // Map to custom display fields
    const history = referrals.map(r => ({
      id: r.id,
      name: `${r.referred_user.first_name} ${r.referred_user.last_name}`.trim(),
      mobile: r.referred_user.mobile_number,
      joinedDate: r.created_at,
      status: r.status,
      rewarded: r.rewarded
    }));

    res.status(200).json({
      success: true,
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error("Error fetching referral history:", err);
    res.status(500).json({ success: false, message: "Failed to load history" });
  }
});

// 4. Get Referral Transactions (GET /referral/transactions)
referral_route.get("/transactions", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
       res.status(401).json({ success: false, message: "Unauthorized" });
       return;
    }

    const page = parseInt(req.query.page as string || "1", 10);
    const limit = parseInt(req.query.limit as string || "10", 10);
    const skip = (page - 1) * limit;

    const transactions = await prisma.referralTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      skip,
      take: limit
    });

    const total = await prisma.referralTransaction.count({ where: { user_id: userId } });

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error("Error fetching referral transactions:", err);
    res.status(500).json({ success: false, message: "Failed to load transactions" });
  }
});

// 5. Redeem Points (POST /referral/redeem)
referral_route.post("/redeem", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
       res.status(401).json({ success: false, message: "Unauthorized" });
       return;
    }

    const { points } = req.body;
    const pointsToRedeem = parseInt(points, 10);

    if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
       res.status(400).json({ success: false, message: "Invalid points amount" });
       return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
       res.status(404).json({ success: false, message: "User not found" });
       return;
    }

    if (user.referral_points < pointsToRedeem) {
       res.status(400).json({ success: false, message: "Insufficient referral points" });
       return;
    }

    // Perform transaction
    await prisma.$transaction([
      prisma.referralTransaction.create({
        data: {
          user_id: userId,
          points: -pointsToRedeem,
          type: "REDEEM",
          reason: "Redeemed Reward Voucher"
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          referral_points: { decrement: pointsToRedeem }
        }
      }),
      prisma.notification.create({
        data: {
          user_id: userId,
          sender_id: 1, // System admin sender
          type: "REFERRAL_REDEEM",
          title: "Voucher Redeemed! 🎁",
          message: `You successfully redeemed ${pointsToRedeem} points. Your voucher details will be sent to your mobile shortly.`
        }
      })
    ]);

    res.status(200).json({ success: true, message: "Points redeemed successfully" });
  } catch (err: any) {
    console.error("Error redeeming points:", err);
    res.status(500).json({ success: false, message: "Failed to redeem points" });
  }
});

export default referral_route;

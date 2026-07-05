"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, Copy, Share2, TrendingUp, Users, CheckCircle2, 
  Clock, Gift, ShieldAlert, ArrowRight, Loader2, Sparkles, Receipt 
} from "lucide-react";
import { useUser } from "@/context/UserContext";

interface ReferralStats {
  total: number;
  successful: number;
  pending: number;
}

interface ReferralHistoryItem {
  id: number;
  name: string;
  mobile: string;
  joinedDate: string;
  status: string;
  rewarded: boolean;
}

interface TransactionItem {
  id: number;
  points: number;
  type: string;
  reason: string;
  created_at: string;
}

export default function ReferralDashboardPage() {
  const { currentUser: user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats>({ total: 0, successful: 0, pending: 0 });
  const [referralCode, setReferralCode] = useState("");
  const [points, setPoints] = useState(0);
  
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [activeTab, setActiveTab] = useState<"referrals" | "transactions">("referrals");
  
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  
  const [redeemAmount, setRedeemAmount] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [redeemError, setRedeemError] = useState("");

  const referralLink = typeof window !== "undefined" 
    ? `${window.location.origin}/login?ref=${referralCode}` 
    : `http://localhost:3000/login?ref=${referralCode}`;

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem("mn_token");
      if (!token) return;

      const [statsRes, historyRes, txRes] = await Promise.all([
        fetch("http://localhost:3333/referral/me", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:3333/referral/history?limit=20", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:3333/referral/transactions?limit=20", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      const [statsData, historyData, txData] = await Promise.all([
        statsRes.json(),
        historyRes.json(),
        txRes.json()
      ]);

      if (statsData.success) {
        setReferralCode(statsData.referralCode);
        setPoints(statsData.points);
        setStats(statsData.stats);
      }

      if (historyData.success) {
        setHistory(historyData.history);
      }

      if (txData.success) {
        setTransactions(txData.transactions);
      }
    } catch (err) {
      console.error("Error fetching referral details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError("");
    setRedeemSuccess(false);

    const pts = parseInt(redeemAmount, 10);
    if (isNaN(pts) || pts <= 0) {
      setRedeemError("Please enter a valid amount of points.");
      return;
    }

    if (pts > points) {
      setRedeemError("Insufficient points in your wallet.");
      return;
    }

    setIsRedeeming(true);
    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch("http://localhost:3333/referral/redeem", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ points: pts })
      });
      const data = await res.json();
      if (data.success) {
        setRedeemSuccess(true);
        setRedeemAmount("");
        fetchReferralData(); // Refresh totals
      } else {
        setRedeemError(data.message || "Failed to redeem points.");
      }
    } catch (err) {
      setRedeemError("A network error occurred. Please try again.");
    } finally {
      setIsRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-2" />
        <p className="text-sm font-semibold">Loading referral stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-playfair text-gray-900 flex items-center gap-2">
          <Award className="w-8 h-8 text-brand-600" /> Referral & Rewards
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Invite your friends to Malappuram Nikah and earn rewards points when they join.
        </p>
      </div>

      {/* Referral Code Box */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-brand-800 to-brand-650 text-white rounded-xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:16px_16px]" />
          
          <div className="relative z-10 space-y-1">
            <span className="bg-white/20 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
              Your Unique Referral Code
            </span>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl font-extrabold tracking-widest font-mono select-all">
                {referralCode || "LOADING..."}
              </span>
              <button 
                onClick={handleCopyCode}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all active:scale-95 cursor-pointer"
                title="Copy Referral Code"
              >
                {copied ? <span className="text-[10px] font-bold px-1 text-green-300">Copied!</span> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-medium text-brand-100 block">Your Referral Link</span>
              <span className="text-xs font-semibold truncate block max-w-full text-brand-50">
                {referralLink}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-white text-brand-800 hover:bg-brand-50 text-xs font-bold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {shared ? "Link Copied!" : "Copy Invite Link"}
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-white rounded-xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between min-h-[180px]">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500">Referral Point Wallet</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-extrabold text-brand-650 font-playfair">{points}</span>
              <span className="text-xs font-bold text-gray-400">pts</span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <form onSubmit={handleRedeem} className="flex gap-2">
              <input
                type="number"
                placeholder="Points to redeem"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={isRedeeming}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 shrink-0 disabled:opacity-50"
              >
                {isRedeeming ? "..." : "Redeem"}
              </button>
            </form>
            {redeemError && <p className="text-[10px] text-red-500 font-semibold">{redeemError}</p>}
            {redeemSuccess && <p className="text-[10px] text-green-600 font-semibold">Redemption successful! Processing...</p>}
          </div>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Invites", val: stats.total, color: "text-gray-900", icon: Users },
          { label: "Joined Members", val: stats.successful, color: "text-green-600", icon: CheckCircle2 },
          { label: "Pending Verification", val: stats.pending, color: "text-amber-600", icon: Clock }
        ].map((c, i) => (
          <div key={i} className="bg-white border border-gray-150/70 p-4 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{c.label}</span>
              <span className={`text-2xl font-extrabold mt-1 block ${c.color}`}>{c.val}</span>
            </div>
            <c.icon className={`w-8 h-8 opacity-20 ${c.color}`} />
          </div>
        ))}
      </div>

      {/* Tabs list */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setActiveTab("referrals")}
            className={`px-6 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "referrals"
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users className="w-4 h-4" /> My Referrals ({history.length})
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-6 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "transactions"
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Receipt className="w-4 h-4" /> Transaction Log ({transactions.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === "referrals" ? (
            history.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Users className="w-8 h-8 mx-auto opacity-30 animate-pulse" />
                <p className="text-xs font-semibold text-gray-700">No referrals yet</p>
                <p className="text-[10px]">Invite your friends using your code to start earning points.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="pb-3">Referral Name</th>
                      <th className="pb-3">Contact</th>
                      <th className="pb-3">Joined Date</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Points Emailed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map((item) => (
                      <tr key={item.id} className="text-gray-700 hover:bg-gray-50/40 transition-colors">
                        <td className="py-3 font-semibold text-gray-900">{item.name}</td>
                        <td className="py-3 font-mono text-gray-500">{item.mobile}</td>
                        <td className="py-3 text-gray-400">
                          {new Date(item.joinedDate).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            item.status === "SUCCESS"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : item.status === "REJECTED"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                          }`}>
                            {item.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 text-right font-extrabold text-gray-900">
                          {item.rewarded ? "+100" : "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            transactions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Receipt className="w-8 h-8 mx-auto opacity-30 animate-pulse" />
                <p className="text-xs font-semibold text-gray-700">No transactions recorded</p>
                <p className="text-[10px]">Points earned or redeemed will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="pb-3">Transaction ID</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Reason</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((item) => (
                      <tr key={item.id} className="text-gray-700 hover:bg-gray-50/40 transition-colors">
                        <td className="py-3 font-mono text-gray-400">TX-{2000 + item.id}</td>
                        <td className="py-3 text-gray-450">
                          {new Date(item.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-3 font-medium text-gray-800">{item.reason}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            item.points > 0
                              ? "bg-green-50 text-green-700 border border-green-150"
                              : "bg-red-50 text-red-700 border border-red-150"
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-extrabold ${
                          item.points > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {item.points > 0 ? `+${item.points}` : item.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

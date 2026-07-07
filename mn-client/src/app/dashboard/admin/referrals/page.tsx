"use client";

import { useState, useEffect } from "react";
import { 
  Award, ShieldCheck, ShieldAlert, Trash2, ArrowLeft, 
  Settings, Users, CheckCircle2, Clock, Plus, Minus, Search, 
  AlertTriangle, CreditCard, Loader2, RefreshCw, X 
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface AdminStats {
  totalUsers: number;
  totalCodes: number;
  totalSuccess: number;
  totalPending: number;
  totalPointsAwarded: number;
  totalPointsRedeemed: number;
}

interface ReferralUser {
  id: number;
  first_name: string;
  last_name: string;
  referral_code: string | null;
  referral_points: number;
  mobile_number: string;
  created_at: string;
  totalReferrals: number;
  successfulReferrals: number;
}

interface ReferralSettingsData {
  points_per_referral: number;
  reward_condition: string;
  enabled: boolean;
  max_referral: number;
  daily_limit: number;
}

interface UserDetail {
  id: number;
  first_name: string;
  last_name: string;
  referral_code: string | null;
  referral_points: number;
  mobile_number: string;
  created_at: string;
  kyc_status: string;
}

interface JoinedUserItem {
  id: number;
  referrer_id: number;
  referred_user_id: number;
  referral_code: string;
  status: string;
  rewarded: boolean;
  created_at: string;
  referred_user: {
    id: number;
    first_name: string;
    last_name: string;
    mobile_number: string;
    created_at: string;
  };
}

interface AdminTransactionItem {
  id: number;
  user_id: number;
  referral_id: number | null;
  points: number;
  type: string;
  reason: string;
  created_at: string;
}

export default function AdminReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ReferralUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCodes: 0,
    totalSuccess: 0,
    totalPending: 0,
    totalPointsAwarded: 0,
    totalPointsRedeemed: 0
  });

  const [settings, setSettings] = useState<ReferralSettingsData>({
    points_per_referral: 100,
    reward_condition: "SIGNUP",
    enabled: true,
    max_referral: 100,
    daily_limit: 10
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  // Modal / User Detail State
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [joinedUsers, setJoinedUsers] = useState<JoinedUserItem[]>([]);
  const [transactions, setTransactions] = useState<AdminTransactionItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Manage Points Form State
  const [ptsAmount, setPtsAmount] = useState("");
  const [ptsReason, setPtsReason] = useState("");
  const [ptsType, setPtsType] = useState<"BONUS" | "DEDUCT">("BONUS");
  const [ptsActionLoading, setPtsActionLoading] = useState(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/referrals?page=${page}&search=${searchQuery}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.referrals);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/referrals/settings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReferrals();
    fetchSettings();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReferrals();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg("");
    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/referrals/settings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSettingsMsg("Settings updated successfully!");
        fetchReferrals();
      } else {
        setSettingsMsg("Failed to update settings.");
      }
    } catch (err) {
      setSettingsMsg("A network error occurred.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const openUserDetail = async (userId: number) => {
    setDetailLoading(true);
    setSelectedUser(null);
    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/referrals/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedUser(data.user);
        setJoinedUsers(data.referrals);
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setPtsActionLoading(true);

    const pts = parseInt(ptsAmount, 10);
    if (isNaN(pts) || pts <= 0) {
      alert("Please enter a valid amount of points.");
      setPtsActionLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/referrals/points`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          points: pts,
          reason: ptsReason,
          type: ptsType
        })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh details & list
        openUserDetail(selectedUser.id);
        fetchReferrals();
        setPtsAmount("");
        setPtsReason("");
        alert("Points updated successfully!");
      } else {
        alert(data.message || "Failed to adjust points.");
      }
    } catch (err) {
      alert("A network error occurred.");
    } finally {
      setPtsActionLoading(false);
    }
  };

  const toggleBlockUser = async (userId: number, block: boolean) => {
    if (!confirm(`Are you sure you want to ${block ? "BLOCK" : "UNBLOCK"} this user's referral code?`)) return;

    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/referrals/block`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId, block })
      });
      const data = await res.json();
      if (data.success) {
        if (selectedUser && selectedUser.id === userId) {
          openUserDetail(userId);
        }
        fetchReferrals();
        alert(data.message);
      }
    } catch (err) {
      alert("A network error occurred.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-playfair text-gray-900 flex items-center gap-2">
            <Award className="w-8 h-8 text-brand-600" /> Referral & Wallet Admin
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure system conditions, manage referral point transactions, and block abuses.
          </p>
        </div>
        <button
          onClick={fetchReferrals}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Referral Users", val: stats.totalUsers, color: "text-gray-900", icon: Users },
          { label: "Active Codes", val: stats.totalCodes, color: "text-brand-600", icon: Award },
          { label: "Successful", val: stats.totalSuccess, color: "text-green-600", icon: CheckCircle2 },
          { label: "Pending Verification", val: stats.totalPending, color: "text-amber-600", icon: Clock },
          { label: "Awarded Points", val: `${stats.totalPointsAwarded} pts`, color: "text-brand-700", icon: Plus },
          { label: "Redeemed Points", val: `${stats.totalPointsRedeemed} pts`, color: "text-red-650", icon: Minus }
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-150 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[90px]">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">{s.label}</span>
            <span className={`text-lg font-extrabold mt-1 block truncate ${s.color}`}>{s.val}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings Module */}
        <div className="bg-white border border-gray-150 rounded-xl shadow-sm overflow-hidden p-6 h-fit">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-3 mb-4">
            <Settings className="w-4.5 h-4.5 text-brand-600" /> Referral Configuration
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700">Enable Referral Feature</label>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="w-4 h-4 text-brand-600 border-gray-300 rounded-sm focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block">Points Awarded Per Referral</label>
              <input
                type="number"
                value={settings.points_per_referral}
                onChange={(e) => setSettings({ ...settings, points_per_referral: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block">Reward Event Condition</label>
              <select
                value={settings.reward_condition}
                onChange={(e) => setSettings({ ...settings, reward_condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="SIGNUP">On New User Signup</option>
                <option value="KYC">After KYC Verification Approved</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block">Max Referrals Per User</label>
              <input
                type="number"
                value={settings.max_referral}
                onChange={(e) => setSettings({ ...settings, max_referral: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block">Daily Signup Limit</label>
              <input
                type="number"
                value={settings.daily_limit}
                onChange={(e) => setSettings({ ...settings, daily_limit: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={settingsLoading}
              className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {settingsLoading ? "Saving..." : "Save Settings"}
            </button>
            {settingsMsg && <p className="text-[10px] text-brand-850 font-bold text-center mt-2">{settingsMsg}</p>}
          </form>
        </div>

        {/* Referrals table list */}
        <div className="lg:col-span-2 bg-white border border-gray-150 rounded-xl shadow-sm overflow-hidden p-6 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-brand-600" /> Referral Users
              </h2>

              <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search user, code, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-full sm:w-48"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm cursor-pointer transition-all shrink-0 active:scale-95"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-2" />
                <p className="text-xs">Loading referrals list...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="py-20 text-center text-gray-400 space-y-1">
                <Users className="w-8 h-8 mx-auto opacity-20" />
                <p className="text-xs font-semibold text-gray-700">No referral users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px] pb-2">
                      <th className="pb-2">User</th>
                      <th className="pb-2">Referral Code</th>
                      <th className="pb-2 text-center">Invites</th>
                      <th className="pb-2 text-center">Success</th>
                      <th className="pb-2 text-center">Points</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((u) => {
                      const isBlocked = u.referral_code?.startsWith("BLOCKED_");
                      return (
                        <tr key={u.id} className="text-gray-700 hover:bg-gray-50/40 transition-colors">
                          <td className="py-2.5">
                            <span className="font-bold text-gray-900 block">{u.first_name} {u.last_name}</span>
                            <span className="text-[10px] text-gray-400 block font-mono">{u.mobile_number}</span>
                          </td>
                          <td className="py-2.5 font-mono text-gray-600 font-bold">
                            {u.referral_code ? u.referral_code.replace("BLOCKED_", "") : "--"}
                          </td>
                          <td className="py-2.5 text-center font-bold">{u.totalReferrals}</td>
                          <td className="py-2.5 text-center text-green-600 font-bold">{u.successfulReferrals}</td>
                          <td className="py-2.5 text-center text-brand-700 font-extrabold">{u.referral_points} pts</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                              isBlocked
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-green-50 text-green-700 border border-green-200"
                            }`}>
                              {isBlocked ? "Blocked" : "Active"}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => openUserDetail(u.id)}
                              className="px-2.5 py-1.5 bg-gray-50 hover:bg-brand-50 text-brand-700 font-bold rounded-lg border border-gray-200 hover:border-brand-200 transition-all text-[10px] cursor-pointer"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-gray-200 text-xs rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-gray-200 text-xs rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User details manager overlay modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {selectedUser.id} • {selectedUser.mobile_number}</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto grid md:grid-cols-2 gap-6">
              {/* Left Column: Stats & Manual Modifications */}
              <div className="space-y-6">
                {/* Stats grid */}
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-150 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Wallet Points</span>
                    <span className="text-xl font-extrabold text-brand-700 mt-1 block">{selectedUser.referral_points} pts</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Referral Status</span>
                    <span className={`text-xs font-bold uppercase mt-1 block ${
                      selectedUser.referral_code?.startsWith("BLOCKED_") ? "text-red-650" : "text-green-600"
                    }`}>
                      {selectedUser.referral_code?.startsWith("BLOCKED_") ? "Blocked / Inactive" : "Active"}
                    </span>
                  </div>
                </div>

                {/* Adjust Points Form */}
                <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-1">
                    <Plus className="w-4 h-4 text-brand-600" /> Manual Points Adjustments
                  </h4>

                  <form onSubmit={handleAdjustPoints} className="space-y-3">
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPtsType("BONUS")}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          ptsType === "BONUS" ? "bg-white text-brand-700 shadow-xs" : "text-gray-500"
                        }`}
                      >
                        Add Bonus
                      </button>
                      <button
                        type="button"
                        onClick={() => setPtsType("DEDUCT")}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          ptsType === "DEDUCT" ? "bg-white text-red-700 shadow-xs" : "text-gray-500"
                        }`}
                      >
                        Deduct Points
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-600 block">Amount of Points</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={ptsAmount}
                        onChange={(e) => setPtsAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-600 block">Reason</label>
                      <input
                        type="text"
                        placeholder="e.g. Compensation for invite issue"
                        value={ptsReason}
                        onChange={(e) => setPtsReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={ptsActionLoading}
                      className="w-full py-2 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      {ptsActionLoading ? "Processing..." : "Apply Adjustment"}
                    </button>
                  </form>
                </div>

                {/* Abuse blocks */}
                <div className="flex gap-3">
                  {selectedUser.referral_code?.startsWith("BLOCKED_") ? (
                    <button
                      onClick={() => toggleBlockUser(selectedUser.id, false)}
                      className="flex-1 py-2 px-4 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Unblock Referral Code
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleBlockUser(selectedUser.id, true)}
                      className="flex-1 py-2 px-4 border border-red-200 bg-red-50 hover:bg-red-100 text-red-750 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Block Referral Code
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Joined Users / Transactions Lists */}
              <div className="space-y-6">
                {/* Joined list */}
                <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    Referred Members ({joinedUsers.length})
                  </h4>
                  {joinedUsers.length === 0 ? (
                    <p className="text-[10px] text-gray-400 py-4 text-center">No members invited yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                      {joinedUsers.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-[10px] p-2 border border-gray-50 rounded-lg hover:bg-gray-50">
                          <div>
                            <span className="font-bold text-gray-950">{item.referred_user.first_name} {item.referred_user.last_name}</span>
                            <span className="text-gray-400 font-mono block">{item.referred_user.mobile_number}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                            item.status === "SUCCESS"
                              ? "bg-green-50 text-green-700 border border-green-150"
                              : "bg-amber-50 text-amber-700 border border-amber-150 animate-pulse"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transactions list */}
                <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    Wallet Transactions ({transactions.length})
                  </h4>
                  {transactions.length === 0 ? (
                    <p className="text-[10px] text-gray-400 py-4 text-center">No wallet transactions recorded.</p>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                      {transactions.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-[10px] p-2 border border-gray-50 rounded-lg hover:bg-gray-50">
                          <div>
                            <span className="font-bold text-gray-800">{item.reason}</span>
                            <span className="text-gray-400 block">{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          <span className={`font-extrabold ${item.points > 0 ? "text-green-600" : "text-red-650"}`}>
                            {item.points > 0 ? `+${item.points}` : item.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

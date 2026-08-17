"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users, UserCheck, ShieldCheck, Award, BarChart3, TrendingUp, Sparkles, Crown, UserMinus,
} from "lucide-react";
import Link from "next/link";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  HorizontalBarChart,
  StatMiniCard,
  VerticalBarChart,
} from "@/components/admin/AdminAnalyticsCharts";
import { adminApi, AdminStats } from "@/lib/admin-api";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    adminApi
      .getStats()
      .then((res) => setStats(res.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const registrationSummary = useMemo(() => {
    const daily = stats?.analytics?.dailyRegistrations ?? [];
    const last7 = daily.slice(-7);
    const last30Total = daily.reduce((sum, d) => sum + d.count, 0);
    const last7Total = last7.reduce((sum, d) => sum + d.count, 0);
    const peakDay = daily.reduce(
      (best, d) => (d.count > best.count ? d : best),
      { label: "—", count: 0, date: "" }
    );
    return { last7Total, last30Total, peakDay };
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
        <Sparkles className="w-10 h-10 text-brand-500 animate-spin" />
        <p className="font-semibold mt-4 text-sm text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-red-600 text-sm">Failed to load dashboard statistics.</div>
    );
  }

  const analytics = stats.analytics;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      <AdminAlert alert={null} />
      <AdminPageHeader
        title="Super Admin Command Center"
        description="Platform overview with user registration trends, verification stats, and referrals."
      />

      {/* User Management Stats */}
      <section className="mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">
          User Management
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-teal-50 text-teal-600", href: "/admin/users" },
            { label: "Active Users", value: stats.activeUsers, icon: UserCheck, color: "bg-emerald-50 text-emerald-600", href: "/admin/users?status=active" },
            { label: "New (30d)", value: stats.newUsers, icon: TrendingUp, color: "bg-brand-50 text-brand-600", href: "/admin/users?status=new" },
            { label: "Inactive", value: stats.inactiveUsers, icon: UserMinus, color: "bg-amber-50 text-amber-600", href: "/admin/users?status=in_active" },
            { label: "Suspended", value: stats.suspendedUsers, icon: Users, color: "bg-red-50 text-red-600", href: "/admin/users?status=suspended" },
            { label: "Premium", value: stats.premiumUsers, icon: Crown, color: "bg-amber-50 text-amber-600", href: "/admin/users?is_premium=true" },
            { label: "Avg Completion", value: `${stats.averageCompletion}%`, icon: BarChart3, color: "bg-purple-50 text-purple-600", href: "/admin/users" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group"
            >
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-brand-600 transition-colors">{item.label}</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{item.value}</h3>
              </div>
              <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Registration analytics */}
      {analytics && (
        <section className="mb-8">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">
            User Registration Analytics
          </h2>

          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <StatMiniCard label="Registered (7 days)" value={registrationSummary.last7Total} />
            <StatMiniCard label="Registered (30 days)" value={registrationSummary.last30Total} />
            <StatMiniCard
              label="Peak day (30d)"
              value={registrationSummary.peakDay.count}
              sub={registrationSummary.peakDay.label}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Daily Registrations</h3>
              <p className="text-[10px] text-gray-400 mb-4">New users per day — last 30 days</p>
              <VerticalBarChart
                data={analytics.dailyRegistrations.map((d) => ({ label: d.label, value: d.count }))}
                barClass="bg-brand-500"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Monthly Registrations</h3>
              <p className="text-[10px] text-gray-400 mb-4">New users per month — last 12 months</p>
              <VerticalBarChart
                data={analytics.monthlyRegistrations.map((m) => ({ label: m.label, value: m.count }))}
                barClass="bg-teal-500"
                height={180}
              />
            </div>
          </div>
        </section>
      )}

      {/* Breakdown charts */}
      {analytics && (
        <section className="mb-8">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">
            User Breakdown
          </h2>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">By Gender</h3>
              <HorizontalBarChart data={analytics.usersByGender} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">By Account Status</h3>
              <HorizontalBarChart
                data={analytics.usersByStatus}
                colors={["bg-emerald-500", "bg-amber-500", "bg-red-500"]}
              />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">By KYC Status</h3>
              <HorizontalBarChart
                data={analytics.usersByKyc}
                colors={["bg-gray-400", "bg-blue-500", "bg-amber-500", "bg-emerald-500", "bg-red-500"]}
              />
            </div>
          </div>
        </section>
      )}

      {/* ID Verification Stats */}
      <section className="mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">
          ID Verification
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pending", value: stats.kycPending, color: "text-amber-700 bg-amber-50" },
            { label: "Under Review", value: stats.kycUnderReview, color: "text-blue-700 bg-blue-50" },
            { label: "Verified", value: stats.kycVerified, color: "text-emerald-700 bg-emerald-50" },
            { label: "Rejected", value: stats.kycRejected, color: "text-red-700 bg-red-50" },
          ].map((item) => (
            <Link
              key={item.label}
              href="/admin/id-verification"
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-brand-200 transition-colors"
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 inline-block px-2 py-0.5 rounded-lg ${item.color}`}>
                {item.value}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Referral Stats */}
      <section className="mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">
          Referrals
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Total Referrals", value: stats.referralTotal, icon: Award },
            { label: "Successful", value: stats.referralSuccess, icon: ShieldCheck },
            { label: "Pending", value: stats.referralPending, icon: Users },
          ].map((item) => (
            <Link
              key={item.label}
              href="/admin/referrals"
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:border-brand-200 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                <h3 className="text-xl font-bold text-gray-900">{item.value}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Navigation</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: "/admin/users", label: "Manage Users" },
            { href: "/admin/id-verification", label: "ID Verification Queue" },
            { href: "/admin/referrals", label: "Referral Management" },
            { href: "/admin/profile", label: "Admin Profile" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-3 rounded-xl border border-gray-100 text-xs font-semibold text-gray-700 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

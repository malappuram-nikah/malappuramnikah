"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Heart, Search, MessageCircle,
  Crown, Settings, LogOut, Menu, X, Bell, Radar, Calendar, ShieldCheck, Briefcase,
  BarChart3, Users, AlertTriangle, CreditCard, LayoutGrid, DollarSign, Layers, User, Award, Edit2,
  MessageSquarePlus, ChevronRight
} from "lucide-react";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { handleSignOut } from "@/lib/auth";
import { useUser } from "@/context/UserContext";

// 1. Matrimonial Member Navigation Items
const memberNavItems = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/matches",  icon: Radar,         label: "AI Matches" },
  { href: "/dashboard/search",   icon: Search,           label: "Search"    },
  { href: "/dashboard/compare",  icon: Layers,           label: "Compare"   },
  { href: "/dashboard/interests",icon: Heart,            label: "Interests" },
  { href: "/dashboard/chat",     icon: MessageCircle,    label: "Chat"      },
  { href: "/dashboard/my-profile",     icon: User,      label: "Manage My Profile" },
  { href: "/dashboard/referral", icon: Award,            label: "Referral & Earn" },
  { href: "/dashboard/premium",  icon: Crown,            label: "Premium"   },
  { href: "/dashboard/save-the-date", icon: Calendar,    label: "Save the Date" },
  { href: "/dashboard/settings", icon: Settings,         label: "Settings"  },
];

// Referral-only Guest Navigation Items
const referralNavItems = [
  { href: "/dashboard/referral", icon: Award,            label: "Referral & Earn" },
  { href: "/dashboard/settings", icon: Settings,         label: "Settings"  },
];

// 2. Wedding Business Creator Navigation Items (Only shown in /dashboard/business)
const businessNavItems = [
  { href: "/dashboard/business?tab=creators",   icon: Briefcase,     label: "Wedding Creators" },
  { href: "/dashboard/business?tab=chat",       icon: MessageCircle, label: "Monitored Chats" },
  { href: "/dashboard/business?tab=templates",  icon: LayoutGrid,    label: "STD & Card Themes" },
  { href: "/dashboard/business?tab=bookings",   icon: Calendar,      label: "B2B Shoot Orders" },
  { href: "/dashboard/business?tab=payouts",    icon: DollarSign,    label: "Commissions Split" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  let activeNavItems = memberNavItems;
  let titlePrefix = "MATCHMAKER";

  if (currentUser?.status === "referral_only") {
    activeNavItems = referralNavItems;
    titlePrefix = "REFERRAL";
  } else if (pathname?.startsWith("/dashboard/business")) {
    activeNavItems = businessNavItems;
    titlePrefix = "B2B WEDDING";
  }

  const navigateTo = (href: string) => {
    router.push(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 h-screen sticky top-0 shrink-0 z-30 select-none",
        collapsed ? "w-20" : "w-64"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center py-5", collapsed ? "flex-col gap-3 px-2 justify-center" : "justify-between px-5")}>
          <div
            onClick={() => navigateTo("/dashboard")}
            className="cursor-pointer block"
            title="Go to Dashboard"
          >
            <Image
              src="/logoMain-01.svg"
              alt="Malappuram Nikah"
              width={collapsed ? 36 : 110}
              height={collapsed ? 36 : 55}
              className={cn("object-contain pointer-events-none transition-all", collapsed ? "h-8 w-8" : "h-10 w-auto")}
            />
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Dynamic Context Header */}
        {!collapsed && titlePrefix !== "MATCHMAKER" && (
          <div className="px-5 pt-4 pb-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
              {titlePrefix} WORKSPACE
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {activeNavItems.map((item) => {
            // Exact match for root dashboard, prefix match for all sub-paths
            // For tab-based URLs (e.g. /dashboard/admin?tab=users), match on base path
            const baseHref = item.href.split("?")[0];
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === baseHref || (pathname?.startsWith(baseHref + "/") ?? false) || pathname?.startsWith(baseHref + "?") || (item.href.includes("?tab=") && pathname === baseHref);
            const isAccent = (item as any).accent;

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigateTo(item.href)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer text-left relative",
                  isActive
                    ? "bg-brand-600 text-white shadow-sm font-semibold"
                    : isAccent
                    ? "text-brand-700 hover:bg-brand-50 border border-brand-100 bg-brand-50/40"
                    : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                )}
              >
                <div className="flex items-center justify-center shrink-0 pointer-events-none">
                  <item.icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive ? "text-white" : isAccent ? "text-brand-600" : "text-gray-400 group-hover:text-brand-600"
                    )}
                    strokeWidth={1.5}
                  />
                </div>
                {!collapsed && (
                  <span className="flex-1 truncate pointer-events-none text-left">
                    {item.label}
                  </span>
                )}
                {!collapsed && (
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 shrink-0 transition-all pointer-events-none",
                      isActive
                        ? "text-white/80 opacity-100"
                        : "text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5"
                    )}
                  />
                )}
              </button>
            );
          })}
        </nav>
        {/* Sign Out Button */}
        <div className="p-3 border-t border-gray-100 mt-auto">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-red-600 hover:bg-red-50 hover:text-red-700 group cursor-pointer text-left",
              collapsed && "justify-center px-0"
            )}
            title="Sign Out"
          >
            <div className="flex items-center justify-center shrink-0 pointer-events-none">
              <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" strokeWidth={1.5} />
            </div>
            {!collapsed && <span className="flex-1 text-left truncate pointer-events-none">Sign Out</span>}
            {!collapsed && (
              <ChevronRight className="w-4 h-4 shrink-0 text-red-300 group-hover:text-red-600 transition-all pointer-events-none group-hover:translate-x-0.5" />
            )}
          </button>
        </div>

      </aside>

      {/* Mobile Bottom Nav (Strictly Matrimonial Users Only) */}
      {pathname === "/dashboard" || (pathname?.startsWith("/dashboard/") && !pathname?.startsWith("/dashboard/business")) ? (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 safe-area-pb select-none">
          {memberNavItems.slice(0, 5).map((item) => {
            const baseHref = item.href.split("?")[0];
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === baseHref || (pathname?.startsWith(baseHref + "/") ?? false);
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigateTo(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all w-full cursor-pointer",
                  isActive ? "text-brand-600" : "text-gray-400"
                )}
              >
                <item.icon className="w-5 h-5 pointer-events-none" />
                <span className="text-[10px] font-medium pointer-events-none">{item.label}</span>
              </button>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}

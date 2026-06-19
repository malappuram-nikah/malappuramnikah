"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Heart, Search, MessageCircle,
  Crown, Settings, LogOut, Menu, X, Bell, Sparkles, Calendar, ShieldCheck, Briefcase,
  BarChart3, Users, AlertTriangle, CreditCard, LayoutGrid, DollarSign, Layers
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// 1. Matrimonial Member Navigation Items
const memberNavItems = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/matches",  icon: Sparkles,         label: "AI Matches" },
  { href: "/dashboard/search",   icon: Search,           label: "Search"    },
  { href: "/dashboard/compare",  icon: Layers,           label: "Compare"   },
  { href: "/dashboard/interests",icon: Heart,            label: "Interests" },
  { href: "/dashboard/chat",     icon: MessageCircle,    label: "Chat"      },
  { href: "/dashboard/premium",  icon: Crown,            label: "Premium"   },
  { href: "/dashboard/save-the-date", icon: Calendar,    label: "Save the Date" },
  { href: "/dashboard/settings", icon: Settings,         label: "Settings"  },
];

// 2. Super Admin Navigation Items (Only shown in /dashboard/admin)
const adminNavItems = [
  { href: "/dashboard/admin?tab=analytics", icon: BarChart3,     label: "Analytics Core" },
  { href: "/dashboard/admin?tab=users",      icon: Users,          label: "User Accounts" },
  { href: "/dashboard/admin?tab=profiles",   icon: ShieldCheck,    label: "Matrimony Profiles" },
  { href: "/dashboard/admin?tab=complaints", icon: AlertTriangle,  label: "Complaints Grid" },
  { href: "/dashboard/admin?tab=plans",      icon: CreditCard,     label: "Premium Plans" },
  { href: "/dashboard/admin?tab=cms",        icon: LayoutGrid,     label: "CMS Management" },
  { href: "/dashboard/business",             icon: Briefcase,      label: "B2B Creator Hub" },
];

// 3. Wedding Business Creator Navigation Items (Only shown in /dashboard/business)
const businessNavItems = [
  { href: "/dashboard/business?tab=creators",   icon: Briefcase,     label: "Wedding Creators" },
  { href: "/dashboard/business?tab=chat",       icon: MessageCircle, label: "Monitored Chats" },
  { href: "/dashboard/business?tab=templates",  icon: LayoutGrid,    label: "STD & Card Themes" },
  { href: "/dashboard/business?tab=bookings",   icon: Calendar,      label: "B2B Shoot Orders" },
  { href: "/dashboard/business?tab=payouts",    icon: DollarSign,    label: "Commissions Split" },
  { href: "/dashboard/admin",                   icon: ShieldCheck,   label: "Matrimony Admin" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Determine active nav items based on page context
  let activeNavItems = memberNavItems;
  let titlePrefix = "MATCHMAKER";

  if (pathname?.startsWith("/dashboard/admin")) {
    activeNavItems = adminNavItems;
    titlePrefix = "SUPER ADMIN";
  } else if (pathname?.startsWith("/dashboard/business")) {
    activeNavItems = businessNavItems;
    titlePrefix = "B2B WEDDING";
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 h-screen sticky top-0 shrink-0",
        collapsed ? "w-20" : "w-64"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          {!collapsed && (
            <Link href="/">
              <Image
                src="/logoMain-01.svg"
                alt="Malappuram Nikah"
                width={110}
                height={55}
                className="h-10 w-auto object-contain"
              />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Context Header */}
        {!collapsed && (
          <div className="px-5 pt-4 pb-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
              {titlePrefix} WORKSPACE
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {activeNavItems.map((item) => {
            // Match active states exactly or by base path + tab parameters
            const isTabActive = pathname === item.href || 
              (typeof window !== "undefined" && 
               item.href.includes("?tab=") && 
               pathname === item.href.split("?")[0] && 
               window.location.search === "?" + item.href.split("?")[1]);

            const isActive = isTabActive || (pathname === item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-brand-600 text-white shadow-sm font-semibold"
                    : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-gray-400 group-hover:text-brand-600")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout / Switch Out */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => {
              localStorage.removeItem("mn_token");
              localStorage.removeItem("mn_logged_in_user_id");
              const draftKeys = [
                "mn_basic_details_draft",
                "mn_religious_info_draft",
                "mn_professional_info_draft",
                "mn_family_details_draft",
                "mn_interests_draft",
                "mn_habits_draft",
                "mn_partner_preferences_draft",
                "mn_profile_photos_draft",
                "mn_video_intro_draft",
                "mn_voice_intro_draft"
              ];
              draftKeys.forEach((key) => localStorage.removeItem(key));
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-700 w-full transition-all group"
          >
            <LogOut className="w-5 h-5 shrink-0 text-gray-400 group-hover:text-brand-600" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav (Strictly Matrimonial Users Only) */}
      {pathname === "/dashboard" || pathname?.startsWith("/dashboard/") && !pathname?.startsWith("/dashboard/admin") && !pathname?.startsWith("/dashboard/business") ? (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 safe-area-pb">
          {memberNavItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                  isActive ? "text-brand-600" : "text-gray-400"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}

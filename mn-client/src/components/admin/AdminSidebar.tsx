"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShieldCheck, Award, User,
  Shirt, Camera, Heart, Briefcase, Calendar, Star, DollarSign,
  ChevronRight, Menu, LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { handleSignOut } from "@/lib/auth";
import Image from "next/image";

type NavItem = { href: string; icon: typeof Users; label: string };
type NavSection = { title: string; items: NavItem[] };

const adminSections: NavSection[] = [
  {
    title: "Admin",
    items: [{ href: "/admin", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    title: "Main Platform Management",
    items: [
      { href: "/admin/users", icon: Users, label: "Users" },
      { href: "/admin/id-verification", icon: ShieldCheck, label: "ID Verification" },
      { href: "/admin/referrals", icon: Award, label: "Referrals" },
    ],
  },
  {
    title: "Business Management",
    items: [
      { href: "/admin/business/dress-rentals", icon: Shirt, label: "Wedding Dress Rentals" },
      { href: "/admin/business/photography", icon: Camera, label: "Photography & Videography" },
      { href: "/admin/business/wedding-services", icon: Heart, label: "Wedding Services" },
      { href: "/admin/business/providers", icon: Briefcase, label: "Service Providers" },
      { href: "/admin/business/bookings", icon: Calendar, label: "Business Bookings" },
      { href: "/admin/business/reviews", icon: Star, label: "Business Reviews" },
      { href: "/admin/business/commissions", icon: DollarSign, label: "Business Commissions" },
    ],
  },
  {
    title: "Admin Account",
    items: [{ href: "/admin/profile", icon: User, label: "Admin Profile" }],
  },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 h-screen sticky top-0 shrink-0 z-30 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between px-5 py-5">
        {!collapsed && (
          <Link href="/admin">
            <Image src="/logoMain-01.svg" alt="Malappuram Nikah" width={110} height={55} className="h-10 w-auto object-contain" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {!collapsed && (
        <div className="px-5 pt-2 pb-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Super Admin Workspace</span>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {adminSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                      active
                        ? "bg-brand-600 text-white shadow-sm font-semibold"
                        : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-white" : "text-gray-400 group-hover:text-brand-600")} strokeWidth={1.5} />
                    {!collapsed && <span className="flex-1 truncate text-left text-xs">{item.label}</span>}
                    {!collapsed && (
                      <ChevronRight className={cn("w-4 h-4 shrink-0", active ? "text-white/80" : "text-gray-300")} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

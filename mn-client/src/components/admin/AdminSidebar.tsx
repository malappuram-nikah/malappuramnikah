"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShieldCheck, Award, User,
  Shirt, Camera, Heart, Briefcase, Calendar, Star, DollarSign,
  ChevronRight, Menu, LogOut, X, Zap,
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
      { href: "/admin/instant-registration", icon: Zap, label: "Instant Registration" },
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-150 sticky top-0 z-30 w-full shrink-0">
        <Link href="/admin">
          <Image src="/logoMain-01.svg" alt="Malappuram Nikah" width={90} height={45} className="h-8 w-auto object-contain" />
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <Link href="/admin" onClick={() => setIsMobileOpen(false)}>
            <Image src="/logoMain-01.svg" alt="Malappuram Nikah" width={100} height={50} className="h-9 w-auto object-contain" />
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {adminSections.map((section) => (
            <div key={section.title}>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                        active
                          ? "bg-brand-600 text-white shadow-sm font-semibold"
                          : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-white" : "text-gray-400 group-hover:text-brand-600")} strokeWidth={1.5} />
                      <span className="flex-1 truncate text-left text-xs">{item.label}</span>
                      <ChevronRight className={cn("w-4 h-4 shrink-0", active ? "text-white/80" : "text-gray-300")} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsMobileOpen(false);
              handleSignOut();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
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
    </>
  );
}

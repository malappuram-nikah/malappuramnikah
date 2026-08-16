"use client";

import { Suspense } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminTabRedirect } from "@/components/admin/AdminTabRedirect";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
              <Suspense fallback={null}>
                <AdminTabRedirect />
              </Suspense>
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}

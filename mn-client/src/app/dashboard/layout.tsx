import type { Metadata } from "next";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CompareProvider } from "@/context/CompareContext";
import { UserProvider } from "@/context/UserContext";
import CompareFloatingBar from "@/components/dashboard/CompareFloatingBar";
import DashboardContentWrapper from "@/components/dashboard/DashboardContentWrapper";
import DashboardProtectedShell from "@/components/auth/DashboardProtectedShell";
import AccountStatusGuard from "@/components/auth/AccountStatusGuard";

export const metadata: Metadata = {
  title: "Dashboard | Malappuram Nikah",
  description: "Manage your profile and find your perfect match.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProtectedShell>
      <UserProvider>
        <AccountStatusGuard>
          <CompareProvider>
            <div className="flex h-screen bg-gray-50 overflow-hidden">
              <DashboardSidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader />
                <DashboardContentWrapper>{children}</DashboardContentWrapper>
              </div>
            </div>
            <CompareFloatingBar />
          </CompareProvider>
        </AccountStatusGuard>
      </UserProvider>
    </DashboardProtectedShell>
  );
}

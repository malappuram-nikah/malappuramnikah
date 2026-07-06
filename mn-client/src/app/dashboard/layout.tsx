import type { Metadata } from "next";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CompareProvider } from "@/context/CompareContext";
import { UserProvider } from "@/context/UserContext";
import CompareFloatingBar from "@/components/dashboard/CompareFloatingBar";
import VerificationWall from "@/components/dashboard/VerificationWall";

export const metadata: Metadata = {
  title: "Dashboard | Malappuram Nikah",
  description: "Manage your profile and find your perfect match.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <CompareProvider>
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 bg-gray-50">
              <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <VerificationWall>
                  {children}
                </VerificationWall>
              </div>
            </main>
          </div>
        </div>
        <CompareFloatingBar />
      </CompareProvider>
    </UserProvider>
  );
}

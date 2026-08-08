"use client";

import { usePathname } from "next/navigation";
import VerificationWall from "@/components/dashboard/VerificationWall";

export default function DashboardContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChat = pathname === "/dashboard/chat";

  if (isChat) {
    return (
      <main className="flex-1 min-h-0 overflow-hidden bg-white md:bg-gray-50 flex flex-col w-full h-full">
        <VerificationWall>
          <div className="w-full h-full flex-1 min-h-0 flex flex-col p-0 m-0 overflow-hidden md:p-3 lg:p-4">
            {children}
          </div>
        </VerificationWall>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <VerificationWall>
          {children}
        </VerificationWall>
      </div>
    </main>
  );
}

"use client";

import { usePathname } from "next/navigation";

export default function AdminShell({
  memberSidebar,
  adminSidebar,
  header,
  contentWrapper,
}: {
  memberSidebar: React.ReactNode;
  adminSidebar: React.ReactNode;
  header: React.ReactNode;
  contentWrapper: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/dashboard/admin");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {isAdmin ? adminSidebar : memberSidebar}
      <div className="flex-1 flex flex-col overflow-hidden">
        {header}
        {contentWrapper}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const TAB_REDIRECTS: Record<string, string> = {
  analytics: "/admin",
  users: "/admin/users",
  profiles: "/admin/users?status=in_active",
  kyc: "/admin/id-verification",
  referrals: "/admin/referrals",
};

function AdminTabRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== "/admin") return;
    const tab = searchParams.get("tab");
    if (tab && TAB_REDIRECTS[tab]) {
      router.replace(TAB_REDIRECTS[tab]);
    }
  }, [pathname, searchParams, router]);

  return null;
}

export { AdminTabRedirect };

import GuestAuthLayout from "@/components/auth/GuestAuthLayout";

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <GuestAuthLayout mode="admin">{children}</GuestAuthLayout>;
}

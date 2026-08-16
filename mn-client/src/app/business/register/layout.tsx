import GuestAuthLayout from "@/components/auth/GuestAuthLayout";

export default function BusinessRegisterLayout({ children }: { children: React.ReactNode }) {
  return <GuestAuthLayout mode="member">{children}</GuestAuthLayout>;
}

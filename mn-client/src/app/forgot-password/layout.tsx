import GuestAuthLayout from "@/components/auth/GuestAuthLayout";

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <GuestAuthLayout mode="member">{children}</GuestAuthLayout>;
}

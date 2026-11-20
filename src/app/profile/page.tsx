import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/auth/profile-editor";
import { requireClaims } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { claims } = await requireClaims();
  if (!claims) redirect("/auth/login");
  return <ProfileEditor />;
}

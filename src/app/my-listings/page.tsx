import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountListingCollection } from "@/components/marketplace/account-listing-collection";
import { requireClaims } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "My listings" };

export default async function MyListingsPage() {
  const { claims } = await requireClaims();
  if (!claims) redirect("/auth/login");
  return <AccountListingCollection mode="mine" />;
}

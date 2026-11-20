import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountListingCollection } from "@/components/marketplace/account-listing-collection";
import { requireClaims } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Saved listings" };

export default async function SavedListingsPage() {
  const { claims } = await requireClaims();
  if (!claims) redirect("/auth/login");
  return <AccountListingCollection mode="saved" />;
}

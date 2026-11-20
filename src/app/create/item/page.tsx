import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateListingForm } from "@/components/marketplace/create-listing-form";
import { requireClaims } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "New item listing" };

export default async function CreateItemPage() {
  const { claims } = await requireClaims();
  if (!claims) redirect("/auth/login");
  return <CreateListingForm />;
}

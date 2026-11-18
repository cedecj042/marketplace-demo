import type { Metadata } from "next";
import { ItemDetailClient } from "@/components/marketplace/item-detail-client";

export const metadata: Metadata = { title: "Marketplace listing" };

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  return <ItemDetailClient id={(await params).id} />;
}

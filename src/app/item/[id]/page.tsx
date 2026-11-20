import type { Metadata } from "next";
import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { ItemDetailClient } from "@/components/marketplace/item-detail-client";

export const metadata: Metadata = { title: "Marketplace listing" };

type ItemPageParams = Promise<{ id: string }>;

export default function ItemPage({ params }: { params: ItemPageParams }) {
  return <Suspense fallback={<ItemPageFallback />}><ItemPageContent params={params} /></Suspense>;
}

async function ItemPageContent({ params }: { params: ItemPageParams }) {
  const { id } = await params;
  return <ItemDetailClient id={id} />;
}

function ItemPageFallback() {
  return <div className="grid min-h-[calc(100vh-4.5rem)] place-items-center"><div className="text-center"><LoaderCircle className="mx-auto size-9 animate-spin text-[#5b5cf0]" /><p className="mt-3 text-sm text-muted-foreground">Loading listing…</p></div></div>;
}

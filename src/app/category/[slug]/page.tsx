import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { MarketplaceShell } from "@/components/marketplace/marketplace-shell";
import { categories, getCategory } from "@/lib/marketplace-data";

export function generateStaticParams() { return categories.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const category = getCategory((await params).slug); return { title: category?.label ?? "Category" }; }

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const category = getCategory(slug); if (!category) notFound();
  return <MarketplaceShell><Suspense fallback={<div className="grid min-h-96 place-items-center text-muted-foreground">Loading listings…</div>}><MarketplaceBrowser category={slug} title={category.label} /></Suspense></MarketplaceShell>;
}

import { Suspense } from "react";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { MarketplaceShell } from "@/components/marketplace/marketplace-shell";

export default function Home() {
  return (
    <MarketplaceShell>
      <Suspense fallback={<div className="grid min-h-96 place-items-center text-muted-foreground">Loading Marketplace…</div>}><MarketplaceBrowser /></Suspense>
    </MarketplaceShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, LoaderCircle, PackageSearch, RotateCcw } from "lucide-react";
import { ItemGrid } from "@/components/marketplace/item-grid";
import type { ListingRecord, PaginatedResponse } from "@/lib/api-types";

export function MarketplaceBrowser({ category, title = "Today's picks" }: { category?: string; title?: string }) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const [items, setItems] = useState<ListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "100" });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    fetch(`/api/listings?${params}`, { signal: controller.signal }).then(async (response) => {
      const payload = await response.json() as PaginatedResponse<ListingRecord> | { error?: { message?: string } };
      if (!response.ok || !("data" in payload)) throw new Error("error" in payload ? payload.error?.message : "Listings could not be loaded.");
      setItems(payload.data);
    }).catch((reason) => {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Listings could not be loaded.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, search, attempt]);

  return <>
    <div className="mb-7"><p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">{search ? "Search results" : category ? "Curated category" : "Selected for you"}</p><h1 className="text-3xl font-semibold tracking-[-0.035em] text-[#171a2b] sm:text-4xl">{search ? `Results for “${search}”` : title}</h1><p className="mt-2 text-sm text-[#7b8191]">{items.length ? `${items.length} listing${items.length === 1 ? "" : "s"}` : "Browse items from local sellers"}</p></div>
    {loading ? <GridSkeleton /> : error ? <StatePanel icon={AlertCircle} title="We couldn't load Marketplace" body={error}><button onClick={() => { setLoading(true); setError(""); setAttempt((value) => value + 1); }} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#111827] px-4 font-semibold text-white"><RotateCcw className="size-4" />Try again</button></StatePanel> : items.length ? <ItemGrid items={items} /> : <StatePanel icon={PackageSearch} title={search ? "No matching listings" : "No listings yet"} body={search ? "Try a broader search or browse another category." : "Be the first to create a listing in this section."} />}
  </>;
}

function GridSkeleton() { return <div aria-label="Loading listings" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5">{Array.from({ length: 10 }, (_, index) => <div key={index} className="overflow-hidden rounded-[18px] border border-white bg-white/80 shadow-sm"><div className="m-2 aspect-square animate-pulse rounded-[13px] bg-gradient-to-br from-[#eceeff] to-[#eef6fa]" /><div className="space-y-3 p-4"><div className="h-5 w-1/3 animate-pulse rounded bg-[#e2e5ed]" /><div className="h-4 w-4/5 animate-pulse rounded bg-[#eceef3]" /><div className="h-3 w-1/2 animate-pulse rounded bg-[#f1f2f6]" /></div></div>)}</div>; }
function StatePanel({ icon: Icon, title, body, children }: { icon: typeof LoaderCircle; title: string; body: string; children?: React.ReactNode }) { return <div className="glass-panel rounded-[22px] px-6 py-16 text-center"><Icon className="mx-auto size-10 text-[#7778a0]" /><h2 className="mt-4 text-xl font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>{children}</div>; }

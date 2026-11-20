"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Bookmark, LoaderCircle, PackageSearch, Plus, RotateCcw } from "lucide-react";
import { ItemGrid } from "@/components/marketplace/item-grid";
import type { DataResponse, ListingRecord } from "@/lib/api-types";

export function AccountListingCollection({ mode }: { mode: "mine" | "saved" }) {
  const [items, setItems] = useState<ListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const saved = mode === "saved";

  useEffect(() => {
    const controller = new AbortController();
    void fetch(saved ? "/api/saved-listings" : "/api/my-listings", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json() as DataResponse<ListingRecord[]> | { error?: { message?: string } };
      if (!response.ok || !("data" in body)) throw new Error("error" in body ? body.error?.message : "Listings could not be loaded.");
      setItems(body.data);
    }).catch((reason: unknown) => {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Listings could not be loaded.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt, saved]);

  return <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-7 sm:py-12">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">Your account</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{saved ? "Saved listings" : "My listings"}</h1><p className="mt-2 text-sm text-muted-foreground">{saved ? "Items you bookmarked for later." : "Everything you have listed for sale."}</p></div>{!saved && <Link href="/create/item" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-[#252d3c]"><Plus className="size-4" />Create listing</Link>}</div>
    {loading ? <div className="glass-panel grid min-h-72 place-items-center rounded-[22px]"><div className="text-center text-sm text-muted-foreground"><LoaderCircle className="mx-auto mb-3 size-7 animate-spin text-[#5b5cf0]" />Loading listings…</div></div> : error ? <State icon={AlertCircle} title="Listings could not be loaded" body={error}><button onClick={() => { setLoading(true); setError(""); setAttempt((value) => value + 1); }} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-semibold text-white"><RotateCcw className="size-4" />Try again</button></State> : items.length ? <ItemGrid items={items} onSavedChange={saved ? (listingId, isSaved) => { if (!isSaved) setItems((current) => current.filter((item) => item.id !== listingId)); } : undefined} /> : <State icon={saved ? Bookmark : PackageSearch} title={saved ? "No saved listings" : "You haven't listed anything yet"} body={saved ? "Tap the heart on any listing to keep it here." : "Create your first listing and it will appear here."}><Link href={saved ? "/" : "/create/item"} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-semibold text-white">{saved ? "Browse Marketplace" : "Create listing"}</Link></State>}
  </main>;
}

function State({ icon: Icon, title, body, children }: { icon: typeof AlertCircle; title: string; body: string; children: React.ReactNode }) {
  return <div className="glass-panel rounded-[22px] px-6 py-16 text-center"><Icon className="mx-auto size-10 text-[#7778a0]" /><h2 className="mt-4 text-xl font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>{children}</div>;
}

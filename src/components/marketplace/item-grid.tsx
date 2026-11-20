"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, ImageIcon } from "lucide-react";
import type { ListingRecord } from "@/lib/api-types";
import { formatPrice } from "@/lib/marketplace-data";

export function ItemGrid({ items, onSavedChange }: { items: ListingRecord[]; onSavedChange?: (listingId: string, saved: boolean) => void }) {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/saved-listings?idsOnly=true", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (response.status === 401) return;
      const body = await response.json() as { data?: string[] };
      if (response.ok && body.data) setSavedIds(new Set(body.data));
    }).catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function toggleSaved(listingId: string) {
    if (pendingIds.has(listingId)) return;
    const shouldSave = !savedIds.has(listingId);
    setPendingIds((current) => new Set(current).add(listingId));
    const response = await fetch(shouldSave ? "/api/saved-listings" : `/api/saved-listings?listing_id=${encodeURIComponent(listingId)}`, shouldSave ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: listingId }) } : { method: "DELETE" }).catch(() => null);
    if (response?.status === 401) {
      router.push("/auth/login");
    } else if (response?.ok) {
      setSavedIds((current) => { const next = new Set(current); if (shouldSave) next.add(listingId); else next.delete(listingId); return next; });
      onSavedChange?.(listingId, shouldSave);
    }
    setPendingIds((current) => { const next = new Set(current); next.delete(listingId); return next; });
  }

  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5">{items.map((item) => <article key={item.id} className="group relative min-w-0 overflow-hidden rounded-[18px] border border-white/80 bg-white/80 shadow-[0_18px_45px_-35px_#0f172a] ring-1 ring-[#dfe3ec]/70 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-32px_#5b5cf0]"><Link href={`/item/${item.id}`} className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#7778ff]/25">
      <div className="relative m-2 mb-0 aspect-square overflow-hidden rounded-[13px] bg-gradient-to-br from-[#eef0ff] to-[#edf8fc]">{item.image_url ? <Image src={item.image_url} alt={item.title} fill sizes="(min-width: 1800px) 20vw, (min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="grid h-full place-items-center text-[#6869de]/35"><ImageIcon className="size-12" /></div>}</div>
      <div className="p-4 pt-3"><div className="flex items-center justify-between gap-2"><p className="text-lg font-semibold tracking-tight">{formatPrice(Number(item.price))}</p>{item.status === "sold" && <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-bold tracking-[0.1em] text-amber-800 uppercase">Sold</span>}</div><h2 className="mt-0.5 truncate text-sm font-medium text-[#343849]">{item.title}</h2><p className="mt-1 truncate text-xs text-[#858b9c]">{item.location}</p></div>
    </Link>
    <button type="button" onClick={() => void toggleSaved(item.id)} disabled={pendingIds.has(item.id)} aria-pressed={savedIds.has(item.id)} aria-label={`${savedIds.has(item.id) ? "Remove" : "Save"} ${item.title}`} className={`absolute right-4 top-4 grid size-9 place-items-center rounded-xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 disabled:opacity-60 ${savedIds.has(item.id) ? "text-[#5b5cf0]" : "text-[#4b5563] hover:text-[#5b5cf0]"}`}><Heart className="size-[17px]" fill={savedIds.has(item.id) ? "currentColor" : "none"} /></button>
  </article>)}</div>;
}

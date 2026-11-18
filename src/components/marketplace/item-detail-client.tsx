"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Heart, ImageIcon, LoaderCircle, MapPin, RotateCcw, Share2, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSellerForm } from "@/components/marketplace/message-seller-form";
import type { DataResponse, ListingRecord } from "@/lib/api-types";
import { formatPrice } from "@/lib/marketplace-data";

export function ItemDetailClient({ id }: { id: string }) {
  const [item, setItem] = useState<ListingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { const controller = new AbortController(); fetch(`/api/listings/${encodeURIComponent(id)}`, { signal: controller.signal }).then(async (response) => { const payload = await response.json() as DataResponse<ListingRecord> | { error?: { message?: string } }; if (!response.ok || !("data" in payload)) throw new Error("error" in payload ? payload.error?.message : "Listing could not be loaded."); setItem(payload.data); }).catch((reason) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Listing could not be loaded."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [id, attempt]);
  if (loading) return <div className="grid min-h-[calc(100vh-4.5rem)] place-items-center"><div className="text-center"><LoaderCircle className="mx-auto size-9 animate-spin text-[#5b5cf0]" /><p className="mt-3 text-sm text-muted-foreground">Loading listing…</p></div></div>;
  if (error || !item) return <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-4"><div className="max-w-md rounded-2xl border bg-white p-10 text-center shadow-sm"><AlertCircle className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-4 text-2xl font-bold">Listing unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error || "This listing may have been removed."}</p><div className="mt-6 flex justify-center gap-3"><Link href="/" className="rounded-lg border px-4 py-2 font-semibold">Back to Marketplace</Link><button onClick={() => { setLoading(true); setError(""); setAttempt((value) => value + 1); }} className="inline-flex items-center gap-2 rounded-lg bg-[#1877f2] px-4 py-2 font-semibold text-white"><RotateCcw className="size-4" />Retry</button></div></div></div>;
  const seller = item.seller_email.split("@")[0];
  return <main className="min-h-[calc(100vh-4.5rem)] p-3 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(380px,0.7fr)] lg:gap-3">
    <section className="relative flex min-h-[45vh] items-center justify-center overflow-hidden rounded-[22px] bg-[#11131c] p-4 sm:min-h-[65vh] lg:min-h-[calc(100vh-6rem)]"><Link href="/" aria-label="Back to Marketplace" className="absolute left-4 top-4 z-20 grid size-10 place-items-center rounded-xl border border-white/20 bg-white/90 shadow backdrop-blur hover:bg-white"><ArrowLeft className="size-5" /></Link>{item.image_url ? <><div className="absolute inset-0 opacity-20 blur-3xl"><Image src={item.image_url} alt="" fill sizes="70vw" className="object-cover" /></div><div className="relative aspect-square w-full max-w-3xl overflow-hidden rounded-[16px]"><Image src={item.image_url} alt={item.title} fill priority sizes="(min-width: 1024px) 65vw, 100vw" className="object-contain" /></div></> : <div className="text-center text-white/50"><ImageIcon className="mx-auto size-20" /><p className="mt-3">No photo provided</p></div>}</section>
    <aside className="glass-panel rounded-[22px] p-5 sm:p-8 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"><div className="flex items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">Marketplace listing</p><h1 className="text-3xl font-semibold tracking-[-0.035em]">{item.title}</h1><p className="mt-2 text-2xl font-semibold">{formatPrice(Number(item.price))}</p><p className="mt-2 text-sm text-muted-foreground">Listed {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.created_at))} · {item.location}</p></div><div className="flex gap-2"><button aria-label="Save listing" className="grid size-10 place-items-center rounded-xl border bg-white/70"><Heart className="size-5" /></button><button aria-label="Share listing" className="grid size-10 place-items-center rounded-xl border bg-white/70"><Share2 className="size-5" /></button></div></div>
      <div className="my-6 border-t" /><h2 className="text-lg font-bold">Details</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-[#4b4f56]">{item.description || "No description provided."}</p><p className="mt-4 flex items-center gap-2 text-sm"><MapPin className="size-5 text-muted-foreground" />{item.location}</p>
      <div className="my-6 border-t" /><h2 className="text-lg font-semibold">Seller information</h2><div className="mt-4 flex items-center gap-3"><Avatar className="size-12"><AvatarFallback className="bg-[#ededff] font-semibold uppercase text-[#5b5cf0]">{seller.slice(0, 2)}</AvatarFallback></Avatar><div><p className="font-semibold">{seller}</p><p className="text-sm text-muted-foreground">Marketplace seller</p></div></div><div className="mt-4 flex items-center gap-2 rounded-xl border border-[#e3e5f2] bg-white/60 p-3 text-sm"><ShieldCheck className="size-5 shrink-0 text-[#5b5cf0]" />Meet in a public place and check the item before paying.</div>
      <MessageSellerForm listingId={item.id} sellerEmail={item.seller_email} title={item.title} />
    </aside>
  </main>;
}

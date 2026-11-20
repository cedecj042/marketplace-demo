"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

export function SaveListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/saved-listings?idsOnly=true&listing_id=${encodeURIComponent(listingId)}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (!response.ok) return;
      const body = await response.json() as { data?: string[] };
      setSaved(Boolean(body.data?.includes(listingId)));
    }).catch(() => undefined);
    return () => controller.abort();
  }, [listingId]);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const shouldSave = !saved;
    const response = await fetch(shouldSave ? "/api/saved-listings" : `/api/saved-listings?listing_id=${encodeURIComponent(listingId)}`, shouldSave ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: listingId }) } : { method: "DELETE" }).catch(() => null);
    if (response?.status === 401) router.push("/auth/login");
    else if (response?.ok) setSaved(shouldSave);
    setPending(false);
  }

  return <button type="button" onClick={() => void toggle()} disabled={pending} aria-pressed={saved} aria-label={saved ? "Remove from saved listings" : "Save listing"} title={saved ? "Saved" : "Save listing"} className={`grid size-10 place-items-center rounded-xl border bg-white/70 transition disabled:opacity-60 ${saved ? "text-[#5b5cf0]" : "text-[#4b5563] hover:text-[#5b5cf0]"}`}><Heart className="size-5" fill={saved ? "currentColor" : "none"} /></button>;
}

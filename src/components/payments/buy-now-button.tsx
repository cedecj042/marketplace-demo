"use client";

import { useEffect, useState } from "react";
import { CreditCard, LoaderCircle, LockKeyhole } from "lucide-react";

type Availability = { available: boolean; reason: string; message: string };

export function BuyNowButton({ listingId, sold }: { listingId: string; sold: boolean }) {
  const [availability, setAvailability] = useState<Availability | null>(sold ? { available: false, reason: "sold", message: "This listing has been sold." } : null);
  const [loading, setLoading] = useState(!sold);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sold) return;
    const controller = new AbortController();
    void fetch(`/api/stripe/checkout?listing_id=${encodeURIComponent(listingId)}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await readApiResponse<{ data?: Availability; error?: { message?: string } }>(response);
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Payment availability could not be checked.");
      setAvailability(body.data);
    }).catch((reason: unknown) => {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Payment availability could not be checked.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [listingId, sold]);

  async function checkout() {
    setOpening(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: listingId }) });
      const body = await readApiResponse<{ data?: { url?: string }; error?: { message?: string } }>(response);
      if (!response.ok || !body.data?.url) throw new Error(body.error?.message || "Stripe Checkout could not be opened.");
      window.location.assign(body.data.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Stripe Checkout could not be opened.");
      setOpening(false);
    }
  }

  if (loading) return <div className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#f1f2f7] text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Checking secure checkout…</div>;
  return <div className="mt-5">
    {availability?.available ? <button type="button" onClick={() => void checkout()} disabled={opening} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] font-semibold text-white shadow-[0_14px_30px_-15px_#635bff] transition hover:bg-[#5149e8] disabled:opacity-60">{opening ? <LoaderCircle className="size-5 animate-spin" /> : <CreditCard className="size-5" />}{opening ? "Opening Stripe…" : "Buy now"}</button> : <div className={`rounded-xl border p-3 text-sm ${availability?.reason === "sold" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-[#e3e5f2] bg-white/60 text-[#697084]"}`}><p className="flex items-center gap-2 font-medium"><LockKeyhole className="size-4 shrink-0" />{availability?.message || "Checkout is unavailable for this listing."}</p></div>}
    {availability?.available && <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><LockKeyhole className="size-3" />Secure Stripe sandbox checkout · 10% platform fee</p>}
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </div>;
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`The payment server returned an empty response (HTTP ${response.status}). Check the server environment configuration.`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`The payment server returned an invalid response (HTTP ${response.status}).`);
  }
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, RotateCcw, ShoppingBag } from "lucide-react";

type OrderStatus = { id: string; listing_id: string; status: "pending" | "paid" | "failed" | "canceled"; currency: string; amount_total: number; paid_at: string | null; listing: { title: string; image_url: string | null } | null };

export function OrderConfirmation({ sessionId }: { sessionId: string }) {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState(sessionId ? "" : "Checkout session is missing.");

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    let attempts = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      attempts += 1;
      try {
        const response = await fetch(`/api/orders/status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        const text = await response.text();
        if (!text) throw new Error(`The order server returned an empty response (HTTP ${response.status}).`);
        let body: { data?: OrderStatus; error?: { message?: string } };
        try { body = JSON.parse(text) as typeof body; } catch { throw new Error(`The order server returned an invalid response (HTTP ${response.status}).`); }
        if (!response.ok || !body.data) throw new Error(body.error?.message || "Order status could not be loaded.");
        if (!active) return;
        setOrder(body.data);
        if (body.data.status === "pending" && attempts < 10) timeout = setTimeout(() => void load(), 1500);
        else if (body.data.status === "pending") setError("Stripe accepted the payment, but the webhook has not confirmed it. Check the webhook endpoint and signing secret, then retry.");
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Order status could not be loaded.");
      }
    }
    void load();
    return () => { active = false; if (timeout) clearTimeout(timeout); };
  }, [sessionId]);

  const paid = order?.status === "paid";
  return <main className="grid min-h-[calc(100vh-4.5rem)] place-items-center px-4 py-12"><section className="glass-panel w-full max-w-lg rounded-[28px] p-7 text-center sm:p-10">
    <span className={`mx-auto grid size-16 place-items-center rounded-2xl ${paid ? "bg-emerald-50 text-emerald-600" : error ? "bg-amber-50 text-amber-600" : "bg-[#eef0ff] text-[#5b5cf0]"}`}>{paid ? <CheckCircle2 className="size-9" /> : error ? <AlertCircle className="size-8" /> : <LoaderCircle className="size-8 animate-spin" />}</span>
    <p className="mt-6 text-[10px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">Stripe Checkout</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{paid ? "Purchase confirmed" : error ? "Confirmation unavailable" : "Confirming your order"}</h1>
    {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : <p className="mt-3 text-sm leading-6 text-muted-foreground">{paid ? `${order?.listing?.title || "Your item"} has been paid successfully. The seller has been notified.` : "Your payment returned successfully. We are waiting for the verified Stripe webhook before marking the listing as sold."}</p>}
    {order && <div className="mt-6 rounded-2xl border border-[#e2e5ed] bg-white/65 p-4 text-left"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#eef0ff] text-[#5b5cf0]"><ShoppingBag className="size-5" /></span><div><p className="font-semibold">{order.listing?.title || "Marketplace order"}</p><p className="text-sm text-muted-foreground">{new Intl.NumberFormat("en-PH", { style: "currency", currency: order.currency.toUpperCase() }).format(order.amount_total / 100)}</p></div></div></div>}
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"><Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#111827] px-5 text-sm font-semibold text-white">Back to Marketplace</Link>{error && <button type="button" onClick={() => window.location.reload()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe2ea] bg-white px-5 text-sm font-semibold"><RotateCcw className="size-4" />Retry confirmation</button>}{order && !error && <Link href={`/item/${order.listing_id}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dfe2ea] bg-white px-5 text-sm font-semibold">View listing</Link>}</div>
  </section></main>;
}

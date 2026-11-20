"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, MessageCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function ListingChatLauncher({ listingId, ownerId }: { listingId: string; ownerId: string | null }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { void createBrowserSupabaseClient().auth.getUser().then(({ data }) => { setUserId(data.user?.id ?? null); setChecked(true); }); }, []);
  if (!ownerId) return <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Chat is available for listings created after the account upgrade.</p>;
  if (!checked) return <div className="mt-6 h-11 animate-pulse rounded-xl bg-[#eceef3]" />;
  if (!userId) return <Link href="/auth/login" className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111827] font-semibold text-white"><MessageCircle className="size-5" />Sign in to message seller</Link>;
  if (userId === ownerId) return <Link href="/messages" className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111827] font-semibold text-white"><MessageCircle className="size-5" />Open seller inbox</Link>;
  async function start() {
    setPending(true); setError("");
    const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: listingId }) });
    const payload = await response.json() as { data?: { id: string }; error?: { message?: string } };
    if (response.ok && payload.data) router.push(`/messages/${payload.data.id}`);
    else { setError(payload.error?.message ?? "Conversation could not be opened."); setPending(false); }
  }
  return <div className="mt-6">{error && <p className="mb-2 rounded-xl bg-red-50 p-3 text-sm text-destructive">{error}</p>}<button onClick={start} disabled={pending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] font-semibold text-white disabled:opacity-60">{pending ? <LoaderCircle className="size-5 animate-spin" /> : <MessageCircle className="size-5" />}{pending ? "Opening chat…" : "Chat with seller"}</button></div>;
}

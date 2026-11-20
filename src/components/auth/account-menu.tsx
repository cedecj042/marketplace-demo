"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function AccountMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <span aria-label="Loading account" className="size-10 animate-pulse rounded-xl bg-[#e9ebf3]" />;
  }

  if (!email) {
    return <Link href="/auth/login" className="rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#252d3c]">Sign in</Link>;
  }

  const initial = email.charAt(0).toUpperCase();

  async function signOut() {
    setSigningOut(true);
    await createBrowserSupabaseClient().auth.signOut();
    setEmail(null);
    setSigningOut(false);
    router.replace("/");
    router.refresh();
  }

  return <>
    <Link href="/profile" aria-label="Open profile" title="Profile" className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#5b5cf0] to-[#22a9e8] text-sm font-semibold text-white shadow-[0_10px_25px_-12px_#5b5cf0] transition hover:brightness-105">{initial}</Link>
    <button type="button" onClick={() => void signOut()} disabled={signingOut} aria-label="Sign out" title="Sign out" className="grid size-10 place-items-center rounded-xl border border-[#e3e6ef] bg-white/70 text-[#475569] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"><LogOut className={`size-[18px] ${signingOut ? "animate-pulse" : ""}`} /></button>
  </>;
}

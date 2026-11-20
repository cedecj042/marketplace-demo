"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, LoaderCircle, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const firstName = String(form.get("first_name") ?? "").trim();
    const lastName = String(form.get("last_name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    if (password.length < 8) { setError("Password must contain at least 8 characters."); setPending(false); return; }
    if (mode === "signup" && (!firstName || firstName.length > 80 || !lastName || lastName.length > 80)) { setError("Enter a valid first and last name."); setPending(false); return; }
    if (mode === "signup" && (!phone || phone.length > 30)) { setError("Enter a valid phone number."); setPending(false); return; }
    const supabase = createBrowserSupabaseClient();
    if (mode === "signup") {
      const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/confirm`, data: { first_name: firstName, last_name: lastName, display_name: `${firstName} ${lastName}`, phone } } });
      if (authError) setError(authError.message);
      else if (data.session) { router.replace("/"); router.refresh(); }
      else setSubmittedEmail(email);
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
      else { router.replace("/"); router.refresh(); }
    }
    setPending(false);
  }
  const signup = mode === "signup";
  if (signup && submittedEmail) {
    return <main className="grid min-h-[calc(100vh-4.5rem)] place-items-center px-4 py-12"><section className="glass-panel w-full max-w-md rounded-[24px] p-7 text-center sm:p-9">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-8" /></span>
      <p className="mt-6 text-[10px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">Account created</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Check your inbox</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">We sent a confirmation link to</p>
      <p className="mt-1 break-all font-semibold text-[#30364a]">{submittedEmail}</p>
      <div className="mt-6 rounded-2xl border border-[#e2e5ed] bg-white/65 p-4 text-left text-sm leading-6 text-[#596174]"><p>Open the email and select the confirmation link. You will be returned to Marketplace with your account activated.</p><p className="mt-2 text-xs text-muted-foreground">If it is not visible after a few minutes, check your spam or junk folder.</p></div>
      <Link href="/auth/login" className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-[#111827] font-semibold text-white transition hover:bg-[#252d3c]">Go to sign in</Link>
      <button type="button" onClick={() => setSubmittedEmail("")} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#5b5cf0] hover:underline"><ArrowLeft className="size-4" />Use a different email</button>
    </section></main>;
  }
  return <main className="grid min-h-[calc(100vh-4.5rem)] place-items-center px-4 py-12"><section className={`glass-panel w-full rounded-[24px] p-7 sm:p-9 ${signup ? "max-w-xl" : "max-w-md"}`}><p className="text-[10px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">Marketplace account</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{signup ? "Create your account" : "Welcome back"}</h1><p className="mt-2 text-sm text-muted-foreground">{signup ? "Create one account to buy, sell, save listings, and chat." : "Sign in to create listings and open your conversations."}</p>
    <form onSubmit={submit} className="mt-7 space-y-5">
      {signup && <div className="grid gap-5 sm:grid-cols-2">
        <label htmlFor="first_name" className="block"><span className="text-sm font-semibold text-[#30364a]">First name</span><div className="relative mt-2"><UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="first_name" name="first_name" type="text" autoComplete="given-name" placeholder="First name" className="h-11 pl-10" maxLength={80} required /></div></label>
        <label htmlFor="last_name" className="block"><span className="text-sm font-semibold text-[#30364a]">Last name</span><div className="relative mt-2"><UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="last_name" name="last_name" type="text" autoComplete="family-name" placeholder="Last name" className="h-11 pl-10" maxLength={80} required /></div></label>
      </div>}
      <label htmlFor={`${mode}-email`} className="block"><span className="text-sm font-semibold text-[#30364a]">Email address</span><div className="relative mt-2"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id={`${mode}-email`} name="email" type="email" autoComplete="email" placeholder="you@example.com" className="h-11 pl-10" required /></div></label>
      {signup && <label htmlFor="phone" className="block"><span className="text-sm font-semibold text-[#30364a]">Phone number</span><div className="relative mt-2"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+63 900 000 0000" className="h-11 pl-10" maxLength={30} required /></div></label>}
      <label htmlFor={`${mode}-password`} className="block"><span className="text-sm font-semibold text-[#30364a]">Password</span><div className="relative mt-2"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id={`${mode}-password`} name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "At least 8 characters" : "Enter your password"} className="h-11 pl-10" minLength={8} required /></div>{signup && <span className="mt-1.5 block text-xs text-muted-foreground">Use at least 8 characters.</span>}</label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-destructive">{error}</p>}
      <button disabled={pending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] font-semibold text-white transition hover:bg-[#252d3c] disabled:opacity-60">{pending && <LoaderCircle className="size-4 animate-spin" />}{signup ? "Create account" : "Sign in"}</button>
    </form><p className="mt-6 text-center text-sm text-muted-foreground">{signup ? "Already have an account?" : "New to Marketplace?"} <Link className="font-semibold text-[#5b5cf0] hover:underline" href={signup ? "/auth/login" : "/auth/sign-up"}>{signup ? "Sign in" : "Create account"}</Link></p></section></main>;
}

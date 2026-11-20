"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import type { ChatMessageRecord, PaginatedResponse } from "@/lib/api-types";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function RealtimeChat({ conversationId, userId }: { conversationId: string; userId: string }) {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const controller = new AbortController();
    fetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`, { signal: controller.signal }).then(async (response) => {
      const payload = await response.json() as PaginatedResponse<ChatMessageRecord> | { error?: { message?: string } };
      if (!response.ok || !("data" in payload)) throw new Error("error" in payload ? payload.error?.message : "Messages could not be loaded.");
      setMessages(payload.data);
    }).catch((reason) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Messages could not be loaded."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const channel = supabase.channel(`conversation:${conversationId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => { const next = payload.new as ChatMessageRecord; setMessages((current) => current.some((message) => message.id === next.id) ? current : [...current, next]); }).subscribe();
    return () => { controller.abort(); void supabase.removeChannel(channel); };
  }, [conversationId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = event.currentTarget; const data = new FormData(form); const body = String(data.get("body") ?? "").trim();
    if (!body) { setPending(false); return; }
    const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversation_id: conversationId, body }) });
    const payload = await response.json() as { data?: ChatMessageRecord; error?: { message?: string } };
    if (response.ok && payload.data) { setMessages((current) => current.some((message) => message.id === payload.data!.id) ? current : [...current, payload.data!]); form.reset(); }
    else setError(payload.error?.message ?? "Message could not be sent.");
    setPending(false);
  }
  return <section className="glass-panel flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[24px]"><div className="border-b border-[#e6e8ef] px-5 py-4"><p className="text-[10px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">Live conversation</p><h1 className="mt-1 text-xl font-semibold">Marketplace chat</h1></div><div className="flex-1 space-y-3 overflow-y-auto p-5">{loading ? <div className="grid h-full place-items-center"><LoaderCircle className="size-7 animate-spin text-[#5b5cf0]" /></div> : messages.length ? messages.map((message) => <div key={message.id} className={`flex ${message.sender_id === userId ? "justify-end" : "justify-start"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${message.sender_id === userId ? "rounded-br-md bg-[#111827] text-white" : "rounded-bl-md border bg-white text-[#303445]"}`}><p className="whitespace-pre-wrap">{message.body}</p><p className={`mt-1 text-[10px] ${message.sender_id === userId ? "text-white/55" : "text-muted-foreground"}`}>{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at))}</p></div></div>) : <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">No messages yet. Say hello to start the conversation.</div>}<div ref={endRef} /></div><form onSubmit={submit} className="border-t border-[#e6e8ef] bg-white/60 p-4"><div className="flex gap-2"><input name="body" aria-label="Message" placeholder="Write a message…" maxLength={2000} className="h-11 min-w-0 flex-1 rounded-xl border border-[#dfe3ec] bg-white px-4 text-sm outline-none focus:border-[#7778ff] focus:ring-4 focus:ring-[#7778ff]/10" /><button disabled={pending} aria-label="Send message" className="grid size-11 place-items-center rounded-xl bg-[#111827] text-white disabled:opacity-60">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</button></div>{error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}</form></section>;
}

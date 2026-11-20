"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, CreditCard, MessageCircle, ShoppingBag, X } from "lucide-react";
import type { DataResponse, NotificationRecord } from "@/lib/api-types";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function NotificationCenter() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void supabase.auth.getUser().then(({ data }) => { setUserId(data.user?.id ?? null); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      if (!session) setNotifications([]);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const supabase = createBrowserSupabaseClient();
    void fetch("/api/notifications?limit=30", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json() as DataResponse<NotificationRecord[]> | { error?: { message?: string } };
      if (!response.ok || !("data" in body)) throw new Error("error" in body ? body.error?.message : "Notifications could not be loaded.");
      setNotifications(body.data);
    }).catch((reason: unknown) => {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Notifications could not be loaded.");
    });

    const channel = supabase.channel(`notifications:${userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
      const incoming = payload.new as NotificationRecord;
      setNotifications((current) => current.some((item) => item.id === incoming.id) ? current : [incoming, ...current].slice(0, 30));
    }).subscribe();

    return () => { controller.abort(); void supabase.removeChannel(channel); };
  }, [userId]);

  const unread = useMemo(() => notifications.filter((notification) => !notification.read_at).length, [notifications]);

  async function markRead(id: string) {
    const target = notifications.find((notification) => notification.id === id);
    if (!target || target.read_at) return;
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    if (response?.ok) setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, read_at: new Date().toISOString() } : notification));
  }

  async function markAllRead() {
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mark_all: true }) }).catch(() => null);
    if (response?.ok) {
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) => notification.read_at ? notification : { ...notification, read_at: readAt }));
    }
  }

  if (loading || !userId) return null;

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} title="Notifications" className="relative grid size-10 place-items-center rounded-xl border border-[#e3e6ef] bg-white/70 text-[#475569] transition hover:border-[#cfd3e3] hover:bg-white"><Bell className="size-[18px]" />{unread > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border-2 border-white bg-[#5b5cf0] px-1 text-[10px] font-bold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}</button>
    {open && createPortal(<div className="fixed inset-0 z-[110]">
      <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#111827]/20 backdrop-blur-[2px]" />
      <section role="dialog" aria-modal="true" aria-labelledby="notifications-title" className="absolute inset-x-3 top-3 flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-[22px] border border-white/80 bg-[#f9faff] shadow-2xl sm:left-auto sm:right-6 sm:top-20 sm:w-[390px]">
        <header className="flex items-center justify-between border-b border-[#e7e9f0] bg-white/80 px-5 py-4"><div><h2 id="notifications-title" className="text-lg font-semibold">Notifications</h2><p className="text-xs text-muted-foreground">{unread ? `${unread} unread` : "You're all caught up"}</p></div><div className="flex items-center gap-1">{unread > 0 && <button type="button" onClick={() => void markAllRead()} title="Mark all as read" aria-label="Mark all notifications as read" className="grid size-9 place-items-center rounded-xl text-[#5b5cf0] transition hover:bg-[#eef0ff]"><CheckCheck className="size-[18px]" /></button>}<button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="grid size-9 place-items-center rounded-xl text-[#596174] transition hover:bg-[#eef0f5]"><X className="size-[18px]" /></button></div></header>
        <div className="overflow-y-auto p-2">{error ? <div className="m-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : notifications.length === 0 ? <div className="px-6 py-14 text-center"><Bell className="mx-auto size-9 text-[#a5aabd]" /><h3 className="mt-3 font-semibold">No notifications yet</h3><p className="mt-1 text-sm text-muted-foreground">New messages and marketplace updates will appear here.</p></div> : notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} onOpen={() => { void markRead(notification.id); setOpen(false); }} />)}</div>
      </section>
    </div>, document.body)}
  </>;
}

function NotificationItem({ notification, onOpen }: { notification: NotificationRecord; onOpen: () => void }) {
  const Icon = notification.type === "message" ? MessageCircle : notification.type === "payment" ? CreditCard : notification.type === "order" ? ShoppingBag : Bell;
  return <Link href={notification.href} onClick={onOpen} className={`relative flex gap-3 rounded-2xl p-3 transition hover:bg-white ${notification.read_at ? "opacity-70" : "bg-[#f0f1ff]"}`}>
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#5b5cf0] shadow-sm"><Icon className="size-[18px]" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#25293a]">{notification.title}</span><span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[#697084]">{notification.body}</span><span className="mt-1 block text-[11px] text-[#9399aa]">{formatNotificationTime(notification.created_at)}</span></span>
    {!notification.read_at && <span aria-label="Unread" className="mt-2 size-2 shrink-0 rounded-full bg-[#5b5cf0]" />}
  </Link>;
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

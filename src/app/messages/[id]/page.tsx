import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RealtimeChat } from "@/components/chat/realtime-chat";
import { requireClaims } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Chat" };
export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) { const { claims } = await requireClaims(); if (!claims) redirect("/auth/login"); const { id } = await params; return <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6"><Link href="/messages" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#5051d9]"><ArrowLeft className="size-4" />All conversations</Link><RealtimeChat conversationId={id} userId={claims.sub} /></main>; }

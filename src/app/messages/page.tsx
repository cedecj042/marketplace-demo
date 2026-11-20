import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConversationInbox } from "@/components/chat/conversation-inbox";
import { requireClaims } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Messages" };
export default async function MessagesPage() { const { claims } = await requireClaims(); if (!claims) redirect("/auth/login"); return <ConversationInbox userId={claims.sub} />; }

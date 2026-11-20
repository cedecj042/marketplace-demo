import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | undefined;

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serverKey) throw new Error("A Supabase server secret is not configured.");
  adminClient ??= createClient(url, serverKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return adminClient;
}

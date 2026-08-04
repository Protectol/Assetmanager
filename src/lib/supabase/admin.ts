import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseServiceKey, getSupabaseUrl } from "@/lib/supabase/env";

export function createServiceClient() {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const anonKey = getSupabaseAnonKey();
  const key = serviceKey || anonKey;

  if (!url || !key) {
    throw new Error("Supabase is not configured. Add credentials to .env.local");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (reqUrl, init) => fetch(reqUrl, { ...init, cache: "no-store" }),
    },
  });
}

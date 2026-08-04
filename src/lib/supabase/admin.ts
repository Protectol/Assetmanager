import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseEnv,
  getSupabaseServiceKey,
  getSupabaseUrl,
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/env";

export function createServiceClient() {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const anonKey = getSupabaseAnonKey();

  if (!url || (!serviceKey && !anonKey)) {
    throw new Error("Supabase is not configured. Add credentials to .env.local");
  }

  if (!isSupabaseConfigured() && !isSupabaseServiceConfigured()) {
    throw new Error("Supabase is not configured. Add credentials to .env.local");
  }

  const key = serviceKey || anonKey || getSupabaseEnv().key;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

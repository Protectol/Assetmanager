export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return false;

  const placeholders = [
    "your_supabase_project_url",
    "your_supabase_anon_key",
    "https://your-project.supabase.co",
  ];

  if (placeholders.includes(url) || placeholders.includes(key)) return false;

  return url.startsWith("http");
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  return { url, key };
}

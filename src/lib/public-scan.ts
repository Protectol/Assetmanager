import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface PublicScanAsset {
  id: string;
  asset_name: string;
  asset_tag: string;
  asset_type: string;
  serial_number: string | null;
  brand: string | null;
  model: string | null;
  condition: string;
  status: string;
  current_holder_id: string | null;
  has_sim?: boolean | null;
  sim_number?: string | null;
}

export interface PublicScanHolder {
  employee_name: string;
  department: string | null;
  location: string | null;
}

export interface PublicScanResult {
  asset: PublicScanAsset;
  holder: PublicScanHolder | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BASE_FIELDS =
  "id, asset_name, asset_tag, asset_type, serial_number, brand, model, condition, status, current_holder_id";
const SIM_FIELDS = `${BASE_FIELDS}, has_sim, sim_number`;

function createScanClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isMissingSimColumnError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === "PGRST204" ||
    e?.code === "PGRST205" ||
    e?.message?.includes("has_sim") === true ||
    e?.message?.includes("sim_number") === true
  );
}

async function lookupAsset(
  supabase: SupabaseClient,
  fields: string,
  decodedId: string
): Promise<PublicScanAsset | null> {
  const isUuid = UUID_RE.test(decodedId);

  if (isUuid) {
    const { data, error } = await supabase
      .from("assets")
      .select(fields)
      .eq("id", decodedId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as unknown as PublicScanAsset;
  }

  const { data: exactTag, error: exactError } = await supabase
    .from("assets")
    .select(fields)
    .ilike("asset_tag", decodedId)
    .maybeSingle();
  if (exactError) throw exactError;
  if (exactTag) return exactTag as unknown as PublicScanAsset;

  const { data: fuzzyTag, error: fuzzyError } = await supabase
    .from("assets")
    .select(fields)
    .ilike("asset_tag", `%${decodedId}%`)
    .limit(1)
    .maybeSingle();
  if (fuzzyError) throw fuzzyError;
  return (fuzzyTag as unknown as PublicScanAsset | null) ?? null;
}

async function fetchAssetRecord(
  supabase: SupabaseClient,
  decodedId: string
): Promise<PublicScanAsset | null> {
  try {
    return await lookupAsset(supabase, SIM_FIELDS, decodedId);
  } catch (err) {
    if (!isMissingSimColumnError(err)) {
      console.error("Public scan asset lookup error:", err);
      return null;
    }
  }

  try {
    return await lookupAsset(supabase, BASE_FIELDS, decodedId);
  } catch (err) {
    console.error("Public scan asset lookup error:", err);
    return null;
  }
}

async function fetchHolder(
  supabase: SupabaseClient,
  holderId: string
): Promise<PublicScanHolder | null> {
  const { data, error } = await supabase
    .from("employees")
    .select("employee_name, department, location")
    .eq("id", holderId)
    .maybeSingle();

  if (error) {
    console.error("Public scan holder lookup error:", error);
    return null;
  }

  return data;
}

export async function fetchPublicAssetScan(
  rawId: string
): Promise<PublicScanResult | null> {
  const decodedId = decodeURIComponent(rawId).trim();
  if (!decodedId) return null;

  const supabase = createScanClient();
  if (!supabase) return null;

  const asset = await fetchAssetRecord(supabase, decodedId);
  if (!asset) return null;

  let holder: PublicScanHolder | null = null;
  if (asset.current_holder_id) {
    holder = await fetchHolder(supabase, asset.current_holder_id);
  }

  return { asset, holder };
}

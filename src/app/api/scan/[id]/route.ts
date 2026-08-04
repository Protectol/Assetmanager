import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint is PUBLIC — no auth required
// It only returns safe, non-sensitive asset info for QR scan display
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Prefer service role key to bypass RLS; fall back to anon key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
    const key = serviceKey || anonKey;

    if (!url || !key) {
      console.error("Scan API: Missing Supabase URL or key");
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    if (!serviceKey) {
      console.warn("Scan API: Using anon key — ensure a public RLS policy exists on assets table.");
    }

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let asset: Record<string, any> | null = null;

    const baseFields = "id, asset_name, asset_tag, asset_type, serial_number, brand, model, condition, status, current_holder_id";
    const simFields = `${baseFields}, has_sim, sim_number`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function runQuery(fields: string, buildQuery: (q: any) => any) {
      const q = supabase.from("assets").select(fields);
      const { data, error } = await buildQuery(q);
      if (error) throw error;
      return data ?? null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function fetchAsset(buildQuery: (q: any) => any) {
      try {
        return await runQuery(simFields, buildQuery);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        // If has_sim / sim_number columns don't exist yet, retry without them
        if (e?.code === "PGRST205" || e?.message?.includes("has_sim") || e?.message?.includes("sim_number")) {
          try {
            return await runQuery(baseFields, buildQuery);
          } catch {
            return null;
          }
        }
        console.error("Scan API query error:", err);
        return null;
      }
    }

    // 1. Try by UUID
    if (isUuid) {
      asset = await fetchAsset((q) => q.eq("id", decodedId).maybeSingle());
    }

    // 2. Fallback: exact asset_tag match
    if (!asset) {
      asset = await fetchAsset((q) => q.ilike("asset_tag", decodedId).maybeSingle());
    }

    // 3. Fallback: fuzzy asset_tag match
    if (!asset) {
      asset = await fetchAsset((q) => q.ilike("asset_tag", `%${decodedId}%`).limit(1).maybeSingle());
    }

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Fetch current holder info if assigned
    let holder = null;
    if (asset.current_holder_id) {
      const { data: holderData } = await supabase
        .from("employees")
        .select("employee_name, department, location")
        .eq("id", asset.current_holder_id)
        .maybeSingle();
      holder = holderData;
    }

    return NextResponse.json({
      asset: {
        id: asset.id,
        asset_name: asset.asset_name,
        asset_tag: asset.asset_tag,
        asset_type: asset.asset_type,
        serial_number: asset.serial_number,
        brand: asset.brand,
        model: asset.model,
        condition: asset.condition,
        status: asset.status,
        has_sim: asset.has_sim ?? null,
        sim_number: asset.sim_number ?? null,
      },
      holder: holder ? {
        employee_name: holder.employee_name,
        department: holder.department,
        location: holder.location,
      } : null,
    });
  } catch (err) {
    console.error("Public asset scan API error:", err);
    return NextResponse.json({ error: "Failed to fetch asset data" }, { status: 500 });
  }
}

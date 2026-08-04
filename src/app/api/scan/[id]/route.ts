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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

    if (!url || !key) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);

    const selectFields = "id, asset_name, asset_tag, asset_type, serial_number, brand, model, condition, status, current_holder_id, has_sim, sim_number";
    let asset = null;

    async function fetchAsset(fields: string) {
      if (isUuid) {
        const { data, error } = await supabase.from("assets").select(fields).eq("id", decodedId).maybeSingle();
        if (error) throw error;
        if (data) return data;
      }
      
      const { data: tagData, error: tagError } = await supabase.from("assets").select(fields).ilike("asset_tag", decodedId).maybeSingle();
      if (tagError) throw tagError;
      if (tagData) return tagData;

      const { data: fuzzyData, error: fuzzyError } = await supabase.from("assets").select(fields).ilike("asset_tag", `%${decodedId}%`).limit(1).maybeSingle();
      if (fuzzyError) throw fuzzyError;
      return fuzzyData;
    }

    try {
      asset = await fetchAsset(selectFields);
    } catch (err: unknown) {
      // Fallback if has_sim or sim_number columns do not exist yet (PGRST205)
      const errorObj = err as { code?: string; message?: string };
      if (errorObj?.code === 'PGRST205' || (errorObj?.message && errorObj.message.includes('has_sim'))) {
        const fallbackFields = "id, asset_name, asset_tag, asset_type, serial_number, brand, model, condition, status, current_holder_id";
        try {
          asset = await fetchAsset(fallbackFields);
        } catch (fallbackErr) {
          console.error("Fallback fetch failed", fallbackErr);
        }
      } else {
        console.error("Asset fetch error", err);
      }
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

    // Return ONLY the safe public fields
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
        has_sim: asset.has_sim,
        sim_number: asset.sim_number,
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

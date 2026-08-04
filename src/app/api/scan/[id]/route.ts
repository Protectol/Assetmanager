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

    // Try by UUID first, then by asset_tag
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);

    let asset = null;

    if (isUuid) {
      const { data } = await supabase
        .from("assets")
        .select("id, asset_name, asset_tag, asset_type, serial_number, brand, model, condition, status, current_holder_id, has_sim, sim_number")
        .eq("id", decodedId)
        .maybeSingle();
      asset = data;
    }

    // Fallback: try by asset_tag
    if (!asset) {
      const { data } = await supabase
        .from("assets")
        .select("id, asset_name, asset_tag, asset_type, serial_number, brand, model, condition, status, current_holder_id, has_sim, sim_number")
        .ilike("asset_tag", decodedId)
        .maybeSingle();
      asset = data;
    }

    // Second fallback: fuzzy match
    if (!asset) {
      const { data } = await supabase
        .from("assets")
        .select("id, asset_name, asset_tag, asset_type, serial_number, brand, model, condition, status, current_holder_id, has_sim, sim_number")
        .ilike("asset_tag", `%${decodedId}%`)
        .limit(1)
        .maybeSingle();
      asset = data;
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

import { NextRequest, NextResponse } from "next/server";
import { fetchPublicAssetScan } from "@/lib/public-scan";

// This endpoint is PUBLIC — no auth required
// It only returns safe, non-sensitive asset info for QR scan display
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await fetchPublicAssetScan(id);

    if (!result) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const { asset, holder, assigned_since } = result;

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
      holder: holder
        ? {
            employee_name: holder.employee_name,
            department: holder.department,
            location: holder.location,
          }
        : null,
      assigned_since: assigned_since ?? null,
    });
  } catch (err) {
    console.error("Public asset scan API error:", err);
    return NextResponse.json({ error: "Failed to fetch asset data" }, { status: 500 });
  }
}

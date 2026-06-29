import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { canManageAssets } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const condition = searchParams.get("condition");
  const assetType = searchParams.get("asset_type");
  const holderId = searchParams.get("holder_id");

  let query = supabase
    .from("assets")
    .select("*, current_holder:employees(id, employee_name, employee_id, department)")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `asset_name.ilike.%${search}%,asset_tag.ilike.%${search}%,serial_number.ilike.%${search}%`
    );
  }
  if (status) query = query.eq("status", status);
  if (condition) query = query.eq("condition", condition);
  if (assetType) query = query.eq("asset_type", assetType);
  if (holderId) query = query.eq("current_holder_id", holderId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canManageAssets(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .insert({
      asset_name: body.asset_name,
      asset_type: body.asset_type,
      asset_tag: body.asset_tag,
      serial_number: body.serial_number,
      brand: body.brand,
      model: body.model,
      purchase_date: body.purchase_date,
      warranty_expiry: body.warranty_expiry,
      condition: body.condition || "new",
      status: body.status || "available",
      remarks: body.remarks,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

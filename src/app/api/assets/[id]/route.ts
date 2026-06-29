import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { canManageAssets } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select(`
      *,
      current_holder:employees(id, employee_name, employee_id, department, email),
      asset_assignments(
        id, assigned_date, is_active, remarks,
        employee:employees(id, employee_name, employee_id)
      )
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canManageAssets(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .update({
      asset_name: body.asset_name,
      asset_type: body.asset_type,
      asset_tag: body.asset_tag,
      serial_number: body.serial_number,
      brand: body.brand,
      model: body.model,
      purchase_date: body.purchase_date,
      warranty_expiry: body.warranty_expiry,
      condition: body.condition,
      status: body.status,
      current_holder_id: body.current_holder_id,
      remarks: body.remarks,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canManageAssets(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { canManageEmployees } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select(`
      *,
      asset_assignments(
        id, assigned_date, is_active,
        asset:assets(id, asset_name, asset_type, asset_tag, serial_number, condition, status)
      )
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canManageEmployees(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .update({
      employee_name: body.employee_name,
      employee_id: body.employee_id,
      department: body.department,
      designation: body.designation,
      location: body.location,
      manager: body.manager,
      email: body.email,
      phone_number: body.phone_number,
      status: body.status,
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
  if (!canManageEmployees(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

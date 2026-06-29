import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { canManageEmployees } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const department = searchParams.get("department");
  const location = searchParams.get("location");

  let query = supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `employee_name.ilike.%${search}%,employee_id.ilike.%${search}%,email.ilike.%${search}%`
    );
  }
  if (status) query = query.eq("status", status);
  if (department) query = query.eq("department", department);
  if (location) query = query.eq("location", location);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canManageEmployees(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_name: body.employee_name,
      employee_id: body.employee_id,
      department: body.department,
      designation: body.designation,
      location: body.location,
      manager: body.manager,
      email: body.email,
      phone_number: body.phone_number,
      status: body.status || "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { canManageLabelTemplates } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("label_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canManageLabelTemplates(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = await createClient();

  if (body.is_default) {
    // Unset current default template
    await supabase
      .from("label_templates")
      .update({ is_default: false })
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("label_templates")
    .insert({
      name: body.name,
      is_default: !!body.is_default,
      width_mm: body.width_mm || 90,
      height_mm: body.height_mm || 29,
      config: body.config || {},
      created_by: auth.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAuditEvent(
    supabase,
    "create_label_template",
    "label_templates",
    data.id,
    { name: data.name },
    auth.id
  );

  return NextResponse.json(data, { status: 201 });
}

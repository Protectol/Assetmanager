import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { canManageLabelTemplates } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("label_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Label template not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canManageLabelTemplates(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = await createClient();

  if (body.is_default) {
    await supabase
      .from("label_templates")
      .update({ is_default: false })
      .neq("id", id);
  }

  const { data, error } = await supabase
    .from("label_templates")
    .update({
      name: body.name,
      is_default: body.is_default,
      width_mm: body.width_mm,
      height_mm: body.height_mm,
      config: body.config,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAuditEvent(
    supabase,
    "update_label_template",
    "label_templates",
    id,
    { name: data.name },
    auth.id
  );

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canManageLabelTemplates(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("label_templates").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAuditEvent(
    supabase,
    "delete_label_template",
    "label_templates",
    id,
    {},
    auth.id
  );

  return NextResponse.json({ success: true });
}

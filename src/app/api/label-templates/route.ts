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

  if (error) {
    if (error.message.includes("schema cache") || error.code === "PGRST205" || error.code === "42P01") {
      return NextResponse.json([
        {
          id: "default-template",
          name: "Standard Asset Label (90x29mm)",
          is_default: true,
          width_mm: 90,
          height_mm: 29,
          config: {
            elements: [
              { id: "company", type: "company_name", x: 5, y: 5, fontSize: 10, fontWeight: "bold", visible: true },
              { id: "asset_name", type: "asset_name", x: 5, y: 14, fontSize: 9, fontWeight: "bold", visible: true },
              { id: "asset_id", type: "asset_id", x: 5, y: 20, fontSize: 11, fontWeight: "bold", fontFamily: "monospace", visible: true },
              { id: "qr_code", type: "qr_code", x: 68, "y": 4, width: 18, height: 18, visible: true },
            ],
            style: { border: true, borderColor: "#e2e8f0", backgroundColor: "#ffffff", padding: 2 }
          },
          created_at: new Date().toISOString()
        }
      ]);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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

  if (error) {
    if (error.message.includes("schema cache") || error.code === "PGRST205" || error.code === "42P01") {
      return NextResponse.json(
        { error: "Table 'label_templates' does not exist in Supabase database yet. Please run the SQL migration script in your Supabase Dashboard." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

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

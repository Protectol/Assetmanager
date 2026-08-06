import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiRole, isErrorResponse } from "@/lib/api-auth";

export async function PUT(request: NextRequest) {
  const auth = await requireApiRole(["admin"]);
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const supabase = await createClient();

  const updates = [
    { key: "company_name", value: body.company_name },
    { key: "company_logo_url", value: body.company_logo_url },
    {
      key: "form_link_expiry_days",
      value: body.form_link_expiry_days === undefined ? undefined : String(body.form_link_expiry_days),
    },
    { key: "asset_categories", value: body.asset_categories },
    { key: "email_default_to", value: body.email_default_to },
    { key: "email_default_cc", value: body.email_default_cc },
    { key: "email_subject_template", value: body.email_subject_template },
    { key: "email_body_template", value: body.email_body_template },
  ];

  for (const setting of updates) {
    if (setting.value === undefined) continue;
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: setting.key, value: setting.value }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

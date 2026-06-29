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
    { key: "form_link_expiry_days", value: String(body.form_link_expiry_days) },
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

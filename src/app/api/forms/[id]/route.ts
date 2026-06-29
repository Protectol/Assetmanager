import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("forms")
    .select(`
      *,
      employee:employees(*),
      form_assets(
        *,
        asset:assets!form_assets_asset_id_fkey(*),
        old_asset:assets!form_assets_old_asset_id_fkey(*)
      ),
      submission:form_submissions(*)
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  return NextResponse.json({
    ...data,
    fullLink: `${appUrl}/form/${data.token}`,
  });
}

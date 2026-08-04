import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { canManageAssets } from "@/lib/auth";
import { generateNextAssetId } from "@/lib/asset-id";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canManageAssets(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const prefix = body.prefix || "IT";
  const padding = Number(body.padding) || 6;
  const separator = body.separator || "-";

  const supabase = await createClient();
  const nextAssetId = await generateNextAssetId(supabase, prefix, padding, separator);

  return NextResponse.json({ asset_id: nextAssetId, prefix });
}

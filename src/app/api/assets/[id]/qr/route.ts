import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQRDataURL, getAssetQRContent, sanitizeQRText } from "@/lib/qr";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: asset, error } = await supabase
    .from("assets")
    .select("id, asset_tag, qr_code_data")
    .eq("id", id)
    .single();

  if (error || !asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const qrText = sanitizeQRText(asset.qr_code_data, asset.asset_tag, asset.id);

  const dataUrl = await generateQRDataURL(qrText, { width: 300 });

  return NextResponse.json({
    asset_id: asset.id,
    asset_tag: asset.asset_tag,
    qr_text: qrText,
    data_url: dataUrl,
  });
}

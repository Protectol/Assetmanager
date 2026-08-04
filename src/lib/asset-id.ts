import { SupabaseClient } from "@supabase/supabase-js";

export interface AssetIdConfig {
  prefix: string;
  padding: number;
  separator: string;
}

export const DEFAULT_ASSET_ID_CONFIG: AssetIdConfig = {
  prefix: "IT",
  padding: 6,
  separator: "-",
};

export async function generateNextAssetId(
  supabase: SupabaseClient,
  customPrefix?: string,
  padding = 6,
  separator = "-"
): Promise<string> {
  const prefix = (customPrefix || "IT").toUpperCase().trim();

  // Try to get sequence row or insert if not exists
  const { data: existingSeq } = await supabase
    .from("asset_id_sequences")
    .select("current_value")
    .eq("prefix", prefix)
    .maybeSingle();

  let nextVal = 1;
  if (existingSeq) {
    nextVal = Number(existingSeq.current_value) + 1;
    await supabase
      .from("asset_id_sequences")
      .update({ current_value: nextVal, updated_at: new Date().toISOString() })
      .eq("prefix", prefix);
  } else {
    await supabase.from("asset_id_sequences").insert({
      prefix,
      current_value: nextVal,
    });
  }

  const paddedNum = String(nextVal).padStart(padding, "0");
  const candidateTag = `${prefix}${separator}${paddedNum}`;

  // Double check if asset_tag exists in assets table to guarantee uniqueness
  const { data: existingAsset } = await supabase
    .from("assets")
    .select("id")
    .eq("asset_tag", candidateTag)
    .maybeSingle();

  if (existingAsset) {
    // Increment again if collision occurs
    return generateNextAssetId(supabase, prefix, padding, separator);
  }

  return candidateTag;
}

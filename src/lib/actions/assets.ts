"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canManageAssets } from "@/lib/auth";
import type { AssetCondition, AssetStatus } from "@/types";

export interface AssetFormData {
  asset_name: string;
  asset_type: string;
  asset_tag: string;
  serial_number?: string;
  brand?: string;
  model?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  condition: AssetCondition;
  status: AssetStatus;
  remarks?: string;
}

async function requireAssetManager() {
  const user = await getCurrentUser();
  if (!user || !canManageAssets(user.role)) {
    throw new Error("Unauthorized");
  }
  return user;
}

function emptyToNull(value?: string) {
  return value?.trim() || null;
}

export async function createAsset(data: AssetFormData) {
  const user = await requireAssetManager();
  const supabase = await createClient();

  const { data: asset, error } = await supabase
    .from("assets")
    .insert({
      asset_name: data.asset_name.trim(),
      asset_type: data.asset_type.trim(),
      asset_tag: data.asset_tag.trim(),
      serial_number: emptyToNull(data.serial_number),
      brand: emptyToNull(data.brand),
      model: emptyToNull(data.model),
      purchase_date: emptyToNull(data.purchase_date),
      warranty_expiry: emptyToNull(data.warranty_expiry),
      condition: data.condition,
      status: data.status,
      remarks: emptyToNull(data.remarks),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("asset_history").insert({
    asset_id: asset.id,
    action: "correction",
    performed_by: user.id,
    remarks: "Asset created",
    metadata: { type: "create" },
  });

  revalidatePath("/assets");
  redirect(`/assets/${asset.id}`);
}

export async function updateAsset(id: string, data: AssetFormData) {
  const user = await requireAssetManager();
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) throw new Error("Asset not found");

  const { error } = await supabase
    .from("assets")
    .update({
      asset_name: data.asset_name.trim(),
      asset_type: data.asset_type.trim(),
      asset_tag: data.asset_tag.trim(),
      serial_number: emptyToNull(data.serial_number),
      brand: emptyToNull(data.brand),
      model: emptyToNull(data.model),
      purchase_date: emptyToNull(data.purchase_date),
      warranty_expiry: emptyToNull(data.warranty_expiry),
      condition: data.condition,
      status: data.status,
      remarks: emptyToNull(data.remarks),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const changes: string[] = [];
  if (existing.status !== data.status) {
    changes.push(`Status: ${existing.status} → ${data.status}`);
  }
  if (existing.condition !== data.condition) {
    changes.push(`Condition: ${existing.condition} → ${data.condition}`);
  }
  if (existing.asset_tag !== data.asset_tag.trim()) {
    changes.push(`Tag: ${existing.asset_tag} → ${data.asset_tag.trim()}`);
  }

  const action = existing.status !== data.status ? "status_change" : "correction";

  await supabase.from("asset_history").insert({
    asset_id: id,
    action,
    performed_by: user.id,
    remarks: changes.length > 0 ? changes.join("; ") : "Asset details updated",
    metadata: { type: "update" },
  });

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  redirect(`/assets/${id}`);
}

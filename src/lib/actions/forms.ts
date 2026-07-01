import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormActionType } from "@/types";
import { generateToken, getExpiryDate } from "@/lib/utils";

interface CreateFormParams {
  employeeId: string;
  actionType: FormActionType;
  assetIds: string[];
  oldAssetIds?: string[];
  notes?: string;
  createdBy: string;
  expiryDays?: number;
}

export async function createForm(supabase: SupabaseClient, params: CreateFormParams) {
  const token = generateToken(12);
  const expiryDays = params.expiryDays || parseInt(process.env.NEXT_PUBLIC_FORM_LINK_EXPIRY_DAYS || "7");
  const expiresAt = getExpiryDate(expiryDays);

  const { data: form, error: formError } = await supabase
    .from("forms")
    .insert({
      token,
      employee_id: params.employeeId,
      action_type: params.actionType,
      status: "pending",
      expires_at: expiresAt.toISOString(),
      created_by: params.createdBy,
      notes: params.notes,
    })
    .select()
    .single();

  if (formError) throw formError;

  const formAssets = params.assetIds.map((assetId, index) => ({
    form_id: form.id,
    asset_id: assetId,
    old_asset_id: params.oldAssetIds?.[index] || null,
  }));

  const { error: assetsError } = await supabase.from("form_assets").insert(formAssets);
  if (assetsError) throw assetsError;

  return { form, token, link: `/form/${token}` };
}

export async function processOnboardingSubmission(
  supabase: SupabaseClient,
  formId: string,
  performedBy: string | null
) {
  const { data: formAssets } = await supabase
    .from("form_assets")
    .select("*, asset:assets!form_assets_asset_id_fkey(*)")
    .eq("form_id", formId);

  const { data: form } = await supabase
    .from("forms")
    .select("employee_id")
    .eq("id", formId)
    .single();

  if (!form || !formAssets) throw new Error("Form not found");

  for (const fa of formAssets) {
    await supabase
      .from("assets")
      .update({
        status: "assigned",
        current_holder_id: form.employee_id,
        condition: fa.condition || "good",
      })
      .eq("id", fa.asset_id);

    await supabase.from("asset_assignments").upsert({
      asset_id: fa.asset_id,
      employee_id: form.employee_id,
      assigned_by: performedBy,
      is_active: true,
      assigned_date: new Date().toISOString(),
    });

    await supabase.from("asset_history").insert({
      employee_id: form.employee_id,
      asset_id: fa.asset_id,
      action: "onboarding",
      current_holder_id: form.employee_id,
      performed_by: performedBy,
      remarks: fa.remarks,
    });
  }
}

export async function processExchangeSubmission(
  supabase: SupabaseClient,
  formId: string,
  performedBy: string | null
) {
  const { data: formAssets } = await supabase
    .from("form_assets")
    .select("*, asset:assets!form_assets_asset_id_fkey(*), old_asset:assets!form_assets_old_asset_id_fkey(*)")
    .eq("form_id", formId);

  const { data: form } = await supabase
    .from("forms")
    .select("employee_id")
    .eq("id", formId)
    .single();

  if (!form || !formAssets) throw new Error("Form not found");

  for (const fa of formAssets) {
    if (fa.old_asset_id) {
      await supabase
        .from("assets")
        .update({ status: "available", current_holder_id: null })
        .eq("id", fa.old_asset_id);

      await supabase
        .from("asset_assignments")
        .update({ is_active: false })
        .eq("asset_id", fa.old_asset_id);

      await supabase.from("asset_history").insert({
        employee_id: form.employee_id,
        asset_id: fa.old_asset_id,
        action: "exchange",
        previous_holder_id: form.employee_id,
        performed_by: performedBy,
        remarks: `Returned during exchange for ${fa.asset?.asset_name}`,
      });
    }

    await supabase
      .from("assets")
      .update({
        status: "assigned",
        current_holder_id: form.employee_id,
        condition: fa.condition || "good",
      })
      .eq("id", fa.asset_id);

    await supabase.from("asset_assignments").upsert({
      asset_id: fa.asset_id,
      employee_id: form.employee_id,
      assigned_by: performedBy,
      is_active: true,
      assigned_date: new Date().toISOString(),
    });

    await supabase.from("asset_history").insert({
      employee_id: form.employee_id,
      asset_id: fa.asset_id,
      action: "exchange",
      previous_holder_id: null,
      current_holder_id: form.employee_id,
      performed_by: performedBy,
      remarks: fa.remarks || `Exchanged from ${fa.old_asset?.asset_name || "previous asset"}`,
    });
  }
}

export async function processReturnSubmission(
  supabase: SupabaseClient,
  formId: string,
  performedBy: string | null
) {
  const { data: formAssets } = await supabase
    .from("form_assets")
    .select("*, asset:assets!form_assets_asset_id_fkey(*)")
    .eq("form_id", formId);

  const { data: form } = await supabase
    .from("forms")
    .select("employee_id")
    .eq("id", formId)
    .single();

  if (!form || !formAssets) throw new Error("Form not found");

  for (const fa of formAssets) {
    await supabase
      .from("assets")
      .update({
        status: "available",
        current_holder_id: null,
        condition: fa.condition || fa.asset?.condition,
      })
      .eq("id", fa.asset_id);

    await supabase
      .from("asset_assignments")
      .update({ is_active: false })
      .eq("asset_id", fa.asset_id);

    await supabase.from("asset_history").insert({
      employee_id: form.employee_id,
      asset_id: fa.asset_id,
      action: "return",
      previous_holder_id: form.employee_id,
      performed_by: performedBy,
      remarks: fa.remarks || "Asset returned",
    });
  }
}

export async function processVerificationSubmission(
  supabase: SupabaseClient,
  formId: string
) {
  const { data: formAssets } = await supabase
    .from("form_assets")
    .select("*")
    .eq("form_id", formId);

  if (!formAssets) throw new Error("Form not found");

  for (const fa of formAssets) {
    await supabase.from("verification_corrections").insert({
      form_id: formId,
      asset_id: fa.asset_id,
      employee_reported: fa.verified ?? true,
      reported_condition: fa.condition,
      reported_remarks: fa.remarks,
    });
  }

  const { data: form } = await supabase
    .from("forms")
    .select("employee_id")
    .eq("id", formId)
    .single();

  if (form) {
    await supabase.from("asset_history").insert({
      employee_id: form.employee_id,
      action: "verification",
      performed_by: null,
      remarks: "Team Member asset verification completed",
      metadata: { form_id: formId },
    });
  }
}

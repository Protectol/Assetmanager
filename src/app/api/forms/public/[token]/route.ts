import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { generateFormPDF } from "@/lib/pdf";
import {
  processOnboardingSubmission,
  processExchangeSubmission,
  processReturnSubmission,
  processVerificationSubmission,
} from "@/lib/actions/forms";
import type { AssetCondition, Form, FormAsset, Employee, Asset } from "@/types";

interface AssetSubmission {
  id: string;
  condition?: AssetCondition;
  remarks?: string;
  verified?: boolean;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: form, error } = await supabase
    .from("forms")
    .select(`
      id, token, action_type, status, expires_at, notes, created_at,
      employee:employees(id, employee_name, employee_id, department, designation, location, email),
      form_assets(
        id, asset_id, old_asset_id, condition, remarks, verified,
        asset:assets!form_assets_asset_id_fkey(id, asset_name, asset_type, asset_tag, serial_number, brand, model, condition),
        old_asset:assets!form_assets_old_asset_id_fkey(id, asset_name, asset_tag, serial_number)
      ),
      submission:form_submissions(id, submitted_at)
    `)
    .eq("token", token)
    .single();

  if (error || !form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (form.status === "pending" && new Date(form.expires_at) < new Date()) {
    await supabase.from("forms").update({ status: "expired" }).eq("id", form.id);
    return NextResponse.json({ error: "Form has expired", status: "expired" }, { status: 410 });
  }

  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["company_name", "company_logo_url"]);

  const settingsMap = Object.fromEntries((settings || []).map((s) => [s.key, s.value]));

  return NextResponse.json({
    ...form,
    companyName: settingsMap.company_name || process.env.NEXT_PUBLIC_COMPANY_NAME,
    companyLogoUrl: settingsMap.company_logo_url || "",
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: form, error: formError } = await supabase
    .from("forms")
    .select(`
      *,
      employee:employees(*),
      form_assets(
        *,
        asset:assets!form_assets_asset_id_fkey(*),
        old_asset:assets!form_assets_old_asset_id_fkey(*)
      )
    `)
    .eq("token", token)
    .single();

  if (formError || !form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (form.status !== "pending") {
    return NextResponse.json({ error: "Form already submitted", status: form.status }, { status: 400 });
  }

  if (new Date(form.expires_at) < new Date()) {
    await supabase.from("forms").update({ status: "expired" }).eq("id", form.id);
    return NextResponse.json({ error: "Form has expired" }, { status: 410 });
  }

  const body = await request.json();
  const { signature, signatureType, assets: assetSubmissions, submission_data: extraData } = body as {
    signature: string;
    signatureType: "draw" | "type";
    assets: AssetSubmission[];
    submission_data?: Record<string, unknown>;
  };

  if (!signature) {
    return NextResponse.json({ error: "Signature is required" }, { status: 400 });
  }

  // For current_verification, skip the standard form_assets update logic
  let updatedFormAssets: unknown[] = [];

  if (form.action_type !== "current_verification") {
    for (const assetSub of assetSubmissions || []) {
      const { error: updateError } = await supabase
        .from("form_assets")
        .update({
          condition: assetSub.condition,
          remarks: assetSub.remarks,
          verified: assetSub.verified,
        })
        .eq("id", assetSub.id)
        .eq("form_id", form.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    }

    const { data: assets } = await supabase
      .from("form_assets")
      .select(`
        *,
        asset:assets!form_assets_asset_id_fkey(*),
        old_asset:assets!form_assets_old_asset_id_fkey(*)
      `)
      .eq("form_id", form.id);
    updatedFormAssets = assets || [];

    try {
      switch (form.action_type) {
        case "onboarding":
          await processOnboardingSubmission(supabase, form.id, form.created_by);
          break;
        case "exchange":
          await processExchangeSubmission(supabase, form.id, form.created_by);
          break;
        case "return":
          await processReturnSubmission(supabase, form.id, form.created_by);
          break;
        case "verification":
          await processVerificationSubmission(supabase, form.id);
          break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process submission";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const { data: settings } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "company_name")
    .single();

  let pdfUrl: string | null = null;

  // Only generate PDF for standard form types
  if (form.action_type !== "current_verification") {
    const pdfBytes = generateFormPDF({
      form: form as Form,
      employee: form.employee as Employee,
      formAssets: (updatedFormAssets || []) as (FormAsset & { asset?: Asset; old_asset?: Asset })[],
      signature,
      signatureType: signatureType || "draw",
      companyName: settings?.value || process.env.NEXT_PUBLIC_COMPANY_NAME,
    });
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    pdfUrl = `data:application/pdf;base64,${pdfBase64}`;
  }

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  const userAgent = request.headers.get("user-agent") || "";

  const submissionData = form.action_type === "current_verification"
    ? { ...(extraData || {}), declared_assets: extraData?.declared_assets }
    : { assets: assetSubmissions };

  const { error: submissionError } = await supabase.from("form_submissions").insert({
    form_id: form.id,
    employee_signature: signature,
    signature_type: signatureType || "draw",
    submission_data: submissionData,
    pdf_url: pdfUrl,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (submissionError) {
    return NextResponse.json({ error: submissionError.message }, { status: 500 });
  }

  // current_verification goes to 'completed', awaiting admin approval
  await supabase.from("forms").update({ status: "completed" }).eq("id", form.id);

  return NextResponse.json({ success: true, pdfUrl });
}

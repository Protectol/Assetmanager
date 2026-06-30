import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();

  // Load the form + submission to extract declared assets
  const { data: form, error } = await supabase
    .from("forms")
    .select(`
      *,
      employee:employees(*),
      submission:form_submissions(*)
    `)
    .eq("id", id)
    .single();

  if (error || !form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (form.action_type !== "current_verification")
    return NextResponse.json({ error: "Only current_verification forms can be approved here" }, { status: 400 });
  if (form.status !== "completed")
    return NextResponse.json({ error: "Form must be submitted before approving" }, { status: 400 });

  const submission = form.submission as { submission_data?: { declared_assets?: DeclaredAsset[] } } | null;
  const declaredAssets: DeclaredAsset[] = submission?.submission_data?.declared_assets || [];
  const employeeId = form.employee_id as string;

  const createdAssets: string[] = [];
  const usedTagsInBatch = new Set<string>();

  for (const declared of declaredAssets) {
    if (!declared.has_asset) continue;

    const assetName = buildAssetName(declared);
    
    // Always generate a unique system tag for sticker printing
    let assetTag = "";
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      assetTag = `AST-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Check in-batch collisions
      if (usedTagsInBatch.has(assetTag)) {
        attempts++;
        continue;
      }
      
      // Check DB collisions
      const { data: existing } = await supabase
        .from("assets")
        .select("id")
        .eq("asset_tag", assetTag)
        .single();
        
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      assetTag = `AST-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    
    usedTagsInBatch.add(assetTag);

    // Insert asset into master
    const { data: newAsset, error: assetError } = await supabase
      .from("assets")
      .insert({
        asset_name: assetName,
        asset_type: declared.category,
        asset_tag: assetTag,
        serial_number: declared.fields?.serial_number || declared.fields?.imei || null,
        brand: declared.fields?.brand || null,
        model: declared.fields?.model || null,
        condition: declared.condition || "good",
        status: "assigned",
        current_holder_id: employeeId,
        remarks: declared.remarks || null,
      })
      .select("id")
      .single();

    if (assetError || !newAsset) continue;

    createdAssets.push(newAsset.id);

    // Create assignment record
    await supabase.from("asset_assignments").insert({
      asset_id: newAsset.id,
      employee_id: employeeId,
      assigned_by: user.id,
      is_active: true,
      remarks: `Auto-created from current asset verification form ${id}`,
    });

    // Create history record
    await supabase.from("asset_history").insert({
      asset_id: newAsset.id,
      employee_id: employeeId,
      action: "assignment",
      current_holder_id: employeeId,
      performed_by: user.id,
      remarks: `Assigned from current asset verification approval`,
      metadata: { form_id: id, declared_category: declared.category },
    });
  }

  // Mark form as approved
  await supabase.from("forms").update({ status: "approved" }).eq("id", id);

  return NextResponse.json({ success: true, assets_created: createdAssets.length });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const reason = (body as { reason?: string }).reason || "Rejected by admin";

  const { data: form } = await supabase.from("forms").select("action_type, status").eq("id", id).single();
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (form.status !== "completed")
    return NextResponse.json({ error: "Form must be submitted first" }, { status: 400 });

  await supabase.from("forms").update({ status: "rejected" }).eq("id", id);
  await supabase.from("asset_history").insert({
    action: "correction",
    performed_by: user.id,
    remarks: `Current verification form ${id} rejected: ${reason}`,
    metadata: { form_id: id, rejection_reason: reason },
  });

  return NextResponse.json({ success: true });
}

interface DeclaredAsset {
  category: string;
  has_asset: boolean;
  fields: Record<string, string>;
  condition: string;
  remarks: string;
}

function buildAssetName(declared: DeclaredAsset): string {
  const parts: string[] = [declared.category];
  if (declared.fields?.brand) parts.push(declared.fields.brand);
  if (declared.fields?.model) parts.push(declared.fields.model);
  if (declared.fields?.size) parts.push(`${declared.fields.size}"`);
  return parts.join(" ").trim();
}

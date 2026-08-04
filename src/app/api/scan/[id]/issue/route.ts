import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id).trim();
    const body = await request.json();

    const { reporter_name, reporter_email, issue_type, description, update_status } = body;

    // Security validation: description is mandatory and length limited
    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a detailed description of the issue (at least 5 characters)." },
        { status: 400 }
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        { error: "Description must be under 1000 characters." },
        { status: 400 }
      );
    }

    // Optional email format validation
    if (reporter_email && typeof reporter_email === "string" && reporter_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(reporter_email.trim())) {
        return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
      }
    }

    const supabase = createServiceClient();

    // Verify asset exists by id or asset_tag
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);
    let query = supabase.from("assets").select("id, asset_tag, asset_name, status");

    if (isUuid) {
      query = query.or(`id.eq.${decodedId},asset_tag.ilike.${decodedId}`);
    } else {
      query = query.ilike("asset_tag", decodedId);
    }

    const { data: asset } = await query.maybeSingle();

    if (!asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    const sanitizedReporterName = (reporter_name || "Anonymous User").trim().slice(0, 100);
    const sanitizedEmail = (reporter_email || "Not Provided").trim().slice(0, 100);
    const sanitizedIssueType = (issue_type || "General Issue").trim().slice(0, 50);
    const sanitizedDesc = description.trim();

    const notePayload = `[PUBLIC ISSUE REPORT] Category: ${sanitizedIssueType} | Reporter: ${sanitizedReporterName} (${sanitizedEmail}) | Details: ${sanitizedDesc}`;

    // 1. Record issue in asset_history
    await supabase.from("asset_history").insert({
      asset_id: asset.id,
      action_type: "maintenance",
      notes: notePayload,
      date: new Date().toISOString(),
    });

    // 2. Log in audit_logs
    await supabase.from("audit_logs").insert({
      action: "PUBLIC_ISSUE_REPORTED",
      table_name: "assets",
      record_id: asset.id,
      payload: {
        asset_tag: asset.asset_tag,
        reporter_name: sanitizedReporterName,
        reporter_email: sanitizedEmail,
        issue_type: sanitizedIssueType,
        description: sanitizedDesc,
      },
    });

    // 3. Optionally update asset status to maintenance if requested or critical
    if (update_status && asset.status !== "maintenance") {
      await supabase
        .from("assets")
        .update({ status: "maintenance", updated_at: new Date().toISOString() })
        .eq("id", asset.id);
    }

    return NextResponse.json({
      success: true,
      message: "Issue report submitted successfully. Protectol Health IT Asset Management team has been notified.",
    });
  } catch (err: unknown) {
    console.error("Public issue report error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while submitting your report. Please try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { canGenerateForms } from "@/lib/auth";
import { createForm } from "@/lib/actions/forms";

const createFormSchema = z.object({
  employeeId: z.string().uuid(),
  actionType: z.enum(["onboarding", "exchange", "return", "verification"]),
  assetIds: z.array(z.string().uuid()).min(1),
  oldAssetIds: z.array(z.string().uuid()).optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canGenerateForms(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { employeeId, actionType, assetIds, oldAssetIds, notes } = parsed.data;

  if (actionType === "exchange") {
    if (!oldAssetIds || oldAssetIds.length !== assetIds.length) {
      return NextResponse.json(
        { error: "Exchange requires an old asset for each new asset" },
        { status: 400 }
      );
    }
  }

  const supabase = await createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .single();

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  try {
    const result = await createForm(supabase, {
      employeeId,
      actionType,
      assetIds,
      oldAssetIds,
      notes,
      createdBy: user.id,
    });

    return NextResponse.json({
      form: result.form,
      token: result.token,
      link: result.link,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create form";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

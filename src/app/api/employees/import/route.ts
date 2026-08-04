import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { canImportEmployees } from "@/lib/auth";
import { parseEmployeeExcel, processEmployeeImportRows } from "@/lib/excel";
import { logAuditEvent } from "@/lib/audit";
import type { Employee, EmployeeStatus } from "@/types";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canImportEmployees(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const isDryRun = formData.get("dry_run") === "true";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const rawRows = parseEmployeeExcel(buffer);
  if (!rawRows || rawRows.length === 0) {
    return NextResponse.json({ error: "Excel file is empty" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existingEmployees, error: fetchErr } = await supabase
    .from("employees")
    .select("*");

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const { previewRows, summary } = processEmployeeImportRows(
    rawRows,
    (existingEmployees || []) as Employee[]
  );

  if (isDryRun) {
    return NextResponse.json({ previewRows, summary });
  }

  // Execute actual import
  let importedNew = 0;
  let importedUpdated = 0;

  const validNewRows = previewRows.filter((r) => r.action_type === "new");
  const validUpdateRows = previewRows.filter((r) => r.action_type === "update");

  // Perform inserts for new employees
  for (const row of validNewRows) {
    let finalEmpId = row.employee_id.trim();
    if (!finalEmpId) {
      finalEmpId = `EMP${String(Date.now()).slice(-6)}`;
    }

    const { error: insertErr } = await supabase.from("employees").insert({
      employee_name: row.employee_name,
      employee_id: finalEmpId,
      department: row.department,
      designation: row.designation,
      location: row.location,
      email: row.email,
      phone_number: row.phone_number || null,
      manager: row.manager || null,
      status: row.status as EmployeeStatus,
    });

    if (!insertErr) {
      importedNew++;
    }
  }

  // Perform updates for existing employees
  for (const row of validUpdateRows) {
    const { error: updateErr } = await supabase
      .from("employees")
      .update({
        employee_name: row.employee_name,
        department: row.department,
        designation: row.designation,
        location: row.location,
        email: row.email,
        phone_number: row.phone_number || null,
        manager: row.manager || null,
        status: row.status as EmployeeStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("employee_id", row.employee_id.trim());

    if (!updateErr) {
      importedUpdated++;
    }
  }

  // Record import history log
  await supabase.from("employee_import_history").insert({
    imported_by: auth.id,
    new_count: importedNew,
    updated_count: importedUpdated,
    invalid_count: summary.invalidCount + summary.duplicateCount,
    filename: file.name,
  });

  // Log to audit log
  await logAuditEvent(
    supabase,
    "employee_import",
    "employees",
    undefined,
    {
      filename: file.name,
      new_count: importedNew,
      updated_count: importedUpdated,
      invalid_count: summary.invalidCount,
    },
    auth.id
  );

  return NextResponse.json({
    success: true,
    summary: {
      total: rawRows.length,
      newCount: importedNew,
      updateCount: importedUpdated,
      invalidCount: summary.invalidCount,
      duplicateCount: summary.duplicateCount,
    },
  });
}

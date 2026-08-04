import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { exportEmployeesToExcel } from "@/lib/excel";
import { logAuditEvent } from "@/lib/audit";
import type { Employee } from "@/types";

export async function GET() {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;

  const supabase = await createClient();

  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .order("employee_id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const buffer = exportEmployeesToExcel((employees || []) as Employee[]);

  await logAuditEvent(
    supabase,
    "employee_export",
    "employees",
    undefined,
    { count: employees?.length || 0 },
    auth.id
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="employees_template_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`,
    },
  });
}

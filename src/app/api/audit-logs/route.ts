import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { canViewAuditLogs } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;
  if (!canViewAuditLogs(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const action = searchParams.get("action");
  const tableName = searchParams.get("table");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

  let query = supabase
    .from("audit_logs")
    .select(`
      *,
      user:users!audit_logs_user_id_fkey(id, full_name, email, role)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action) query = query.eq("action", action);
  if (tableName) query = query.eq("table_name", tableName);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

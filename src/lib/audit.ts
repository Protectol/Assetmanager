import { SupabaseClient } from "@supabase/supabase-js";

export async function logAuditEvent(
  supabase: SupabaseClient,
  action: string,
  tableName: string,
  recordId?: string,
  payload?: Record<string, unknown>,
  userId?: string
) {
  try {
    await supabase.from("audit_logs").insert({
      action,
      table_name: tableName,
      record_id: recordId || null,
      payload: payload || {},
      user_id: userId || null,
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

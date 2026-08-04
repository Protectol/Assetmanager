import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, canViewAuditLogs } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import type { AuditLog } from "@/types";

export default async function AuditLogsPage() {
  const user = await requireAuth();
  if (!canViewAuditLogs(user.role)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select(`
      *,
      user:users!audit_logs_user_id_fkey(id, full_name, email, role)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const auditLogs = (logs || []) as AuditLog[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enterprise Audit Trail & System Logs</h2>
          <p className="text-muted-foreground">
            Complete, immutable audit log for employee imports, asset lifecycle updates, and system events
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Audit Log Register ({auditLogs.length})
          </CardTitle>
          <CardDescription>
            Admin-only security and operational audit trail. Click any log entry to inspect full event payload JSON.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={auditLogs} />
        </CardContent>
      </Card>
    </div>
  );
}

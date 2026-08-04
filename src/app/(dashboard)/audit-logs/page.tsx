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

  // Safely fetch audit logs without forcing strict join that can fail on NULL foreign keys
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const rawLogs = logs || [];
  const userIds = Array.from(new Set(rawLogs.map((l) => l.user_id).filter(Boolean)));

  let userMap: Record<string, { id: string; full_name: string; email: string; role: string }> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .in("id", userIds);
    if (users) {
      userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    }
  }

  const auditLogs: AuditLog[] = rawLogs.map((log) => ({
    ...log,
    user: log.user_id ? userMap[log.user_id] || null : null,
  }));

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

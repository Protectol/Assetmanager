import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, capitalize } from "@/lib/utils";
import type { Form } from "@/types";
import { EmptyState } from "@/components/ui/loading";
import { ExternalLink } from "lucide-react";

interface PendingActionsProps {
  forms: (Form & { employee?: { employee_name: string; employee_id: string; department: string } })[];
}

export function PendingActions({ forms }: PendingActionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pending Employee Actions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/forms?status=pending">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {forms.length === 0 ? (
          <EmptyState title="No pending actions" description="All forms have been completed" />
        ) : (
          <div className="space-y-3">
            {forms.map((form) => (
              <div key={form.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{form.employee?.employee_name}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={form.action_type} />
                    <span className="text-xs text-muted-foreground">
                      Expires {formatDateTime(form.expires_at)}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/forms/${form.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

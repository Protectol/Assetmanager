import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, capitalize } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export default async function FormsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; action_type?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("forms")
    .select(`
      *,
      employee:employees(id, employee_name, employee_id, department),
      submission:form_submissions(id, submitted_at)
    `)
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.action_type) query = query.eq("action_type", params.action_type);

  const { data: forms } = await query;

  const statuses = ["all", "pending", "completed", "approved", "rejected", "expired"];
  const currentStatus = params.status || "all";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Forms</h2>
        <p className="text-muted-foreground">Manage employee asset forms and track submissions</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Button
            key={status}
            variant={currentStatus === status ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={status === "all" ? "/forms" : `/forms?status=${status}`}>
              {status === "all" ? "All" : capitalize(status)}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStatus === "all" ? "All Forms" : `${capitalize(currentStatus)} Forms`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!forms || forms.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No forms found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{form.employee?.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{form.employee?.employee_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={form.action_type} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={form.status} />
                    </TableCell>
                    <TableCell className="text-sm">{formatDateTime(form.created_at)}</TableCell>
                    <TableCell className="text-sm">{formatDateTime(form.expires_at)}</TableCell>
                    <TableCell className="text-sm">
                      {form.submission?.submitted_at
                        ? formatDateTime(form.submission.submitted_at)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/forms/${form.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

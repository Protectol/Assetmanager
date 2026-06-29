import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  User,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/loading";
import { EmployeeActionButtons } from "@/components/employees/generate-form-dialog";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Asset, AssetHistory, Employee, Form } from "@/types";

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS = [
  { id: "info", label: "Info" },
  { id: "assets", label: "Current Assets" },
  { id: "history", label: "Asset History" },
  { id: "forms", label: "Generated Forms" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: EmployeeDetailPageProps) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab: TabId = TABS.some((t) => t.id === tabParam)
    ? (tabParam as TabId)
    : "info";

  const supabase = await createClient();

  const [
    { data: employee, error: employeeError },
    { data: currentAssets },
    { data: availableAssets },
    { data: history },
    { data: forms },
  ] = await Promise.all([
    supabase.from("employees").select("*").eq("id", id).single(),
    supabase
      .from("assets")
      .select("*")
      .eq("current_holder_id", id)
      .eq("status", "assigned")
      .order("asset_name"),
    supabase
      .from("assets")
      .select("*")
      .eq("status", "available")
      .order("asset_name"),
    supabase
      .from("asset_history")
      .select(`
        *,
        asset:assets(id, asset_name, asset_tag),
        performer:users(id, full_name)
      `)
      .eq("employee_id", id)
      .order("date", { ascending: false }),
    supabase
      .from("forms")
      .select(`
        *,
        submission:form_submissions(id, submitted_at)
      `)
      .eq("employee_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (employeeError || !employee) {
    notFound();
  }

  const employeeData = employee as Employee;
  const assignedAssets = (currentAssets || []) as Asset[];
  const freeAssets = (availableAssets || []) as Asset[];
  const historyItems = (history || []) as AssetHistory[];
  const formItems = (forms || []) as Form[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/employees">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {employeeData.employee_name}
              </h2>
              <StatusBadge status={employeeData.status} />
            </div>
            <p className="text-muted-foreground">
              {employeeData.employee_id} · {employeeData.department} ·{" "}
              {employeeData.designation}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <EmployeeActionButtons
            employeeId={employeeData.id}
            employeeName={employeeData.employee_name}
            availableAssets={freeAssets}
            currentAssets={assignedAssets}
          />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/employees/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit Employee
            </Link>
          </Button>
        </div>
      </div>

      <div className="border-b">
        <nav className="-mb-px flex gap-4 overflow-x-auto">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={`/employees/${id}?tab=${tab.id}`}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {activeTab === "info" && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-6 sm:grid-cols-2">
              <InfoItem icon={User} label="Employee ID" value={employeeData.employee_id} />
              <InfoItem icon={Building2} label="Department" value={employeeData.department} />
              <InfoItem icon={Briefcase} label="Designation" value={employeeData.designation} />
              <InfoItem icon={MapPin} label="Location" value={employeeData.location} />
              <InfoItem icon={User} label="Manager" value={employeeData.manager || "—"} />
              <InfoItem icon={Mail} label="Email" value={employeeData.email} />
              <InfoItem icon={Phone} label="Phone" value={employeeData.phone_number || "—"} />
              <InfoItem
                icon={User}
                label="Status"
                value={<StatusBadge status={employeeData.status} />}
              />
              <InfoItem
                icon={User}
                label="Created"
                value={formatDate(employeeData.created_at)}
              />
              <InfoItem
                icon={User}
                label="Last Updated"
                value={formatDate(employeeData.updated_at)}
              />
            </dl>
          </CardContent>
        </Card>
      )}

      {activeTab === "assets" && (
        <Card>
          <CardHeader>
            <CardTitle>Current Assets ({assignedAssets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {assignedAssets.length === 0 ? (
              <EmptyState
                title="No assets assigned"
                description="Generate an onboarding form to assign assets to this employee"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <Link
                          href={`/assets/${asset.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {asset.asset_name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{asset.asset_tag}</TableCell>
                      <TableCell>{asset.asset_type}</TableCell>
                      <TableCell>{asset.serial_number || "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={asset.condition} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={asset.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Asset History</CardTitle>
          </CardHeader>
          <CardContent>
            {historyItems.length === 0 ? (
              <EmptyState
                title="No asset history"
                description="Asset movements for this employee will appear here"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{formatDateTime(item.date)}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.action} />
                      </TableCell>
                      <TableCell>
                        {item.asset ? (
                          <Link
                            href={`/assets/${item.asset_id}`}
                            className="text-primary hover:underline"
                          >
                            {item.asset.asset_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.performer?.full_name || "System"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {item.remarks || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "forms" && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Forms</CardTitle>
          </CardHeader>
          <CardContent>
            {formItems.length === 0 ? (
              <EmptyState
                title="No forms generated"
                description="Use the action buttons above to generate onboarding, exchange, return, or verification forms"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formItems.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="text-sm">{formatDateTime(form.created_at)}</TableCell>
                      <TableCell>
                        <StatusBadge status={form.action_type} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={form.status} />
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(form.expires_at)}</TableCell>
                      <TableCell className="text-sm">
                        {form.submission?.submitted_at
                          ? formatDateTime(form.submission.submitted_at)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/forms/${form.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

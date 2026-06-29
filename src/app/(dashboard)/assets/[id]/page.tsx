import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canManageAssets } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/loading";
import { formatDate, formatDateTime, capitalize } from "@/lib/utils";
import type { Asset, AssetAssignment, AssetHistory } from "@/types";

interface AssetDetailPageProps {
  params: Promise<{ id: string }>;
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();
  const canManage = user ? canManageAssets(user.role) : false;

  const { data: asset } = await supabase
    .from("assets")
    .select(`
      *,
      current_holder:employees!assets_current_holder_id_fkey(id, employee_name, employee_id, department, designation)
    `)
    .eq("id", id)
    .single();

  if (!asset) notFound();

  const [{ data: assignment }, { data: history }] = await Promise.all([
    supabase
      .from("asset_assignments")
      .select(`
        *,
        employee:employees(id, employee_name, employee_id, department),
        assigned_by_user:users!asset_assignments_assigned_by_fkey(id, full_name)
      `)
      .eq("asset_id", id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("asset_history")
      .select(`
        *,
        employee:employees!asset_history_employee_id_fkey(id, employee_name, employee_id),
        previous_holder:employees!asset_history_previous_holder_id_fkey(id, employee_name),
        current_holder:employees!asset_history_current_holder_id_fkey(id, employee_name),
        performer:users(id, full_name)
      `)
      .eq("asset_id", id)
      .order("date", { ascending: false }),
  ]);

  const typedAsset = asset as Asset;
  const typedAssignment = assignment as (AssetAssignment & {
    assigned_by_user?: { id: string; full_name: string };
  }) | null;
  const typedHistory = (history as AssetHistory[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href="/assets">
              <ArrowLeft className="h-4 w-4" />
              Back to Assets
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">{typedAsset.asset_name}</h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{typedAsset.asset_tag}</span>
            <StatusBadge status={typedAsset.status} />
            <StatusBadge status={typedAsset.condition} />
          </div>
        </div>
        {canManage && (
          <Button asChild>
            <Link href={`/assets/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Asset Type" value={typedAsset.asset_type} />
              <DetailField label="Serial Number" value={typedAsset.serial_number} />
              <DetailField label="Brand" value={typedAsset.brand} />
              <DetailField label="Model" value={typedAsset.model} />
              <DetailField label="Purchase Date" value={formatDate(typedAsset.purchase_date)} />
              <DetailField label="Warranty Expiry" value={formatDate(typedAsset.warranty_expiry)} />
              <DetailField label="Created" value={formatDateTime(typedAsset.created_at)} />
              <DetailField label="Last Updated" value={formatDateTime(typedAsset.updated_at)} />
            </dl>
            {typedAsset.remarks && (
              <>
                <Separator className="my-4" />
                <DetailField label="Remarks" value={typedAsset.remarks} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            {typedAssignment?.employee ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField
                  label="Employee"
                  value={
                    <Link
                      href={`/employees/${typedAssignment.employee.id}`}
                      className="text-primary hover:underline"
                    >
                      {typedAssignment.employee.employee_name}
                    </Link>
                  }
                />
                <DetailField label="Employee ID" value={typedAssignment.employee.employee_id} />
                <DetailField label="Department" value={typedAssignment.employee.department} />
                <DetailField label="Assigned Date" value={formatDateTime(typedAssignment.assigned_date)} />
                <DetailField
                  label="Assigned By"
                  value={typedAssignment.assigned_by_user?.full_name || "—"}
                />
                {typedAssignment.remarks && (
                  <DetailField label="Assignment Remarks" value={typedAssignment.remarks} />
                )}
              </dl>
            ) : typedAsset.current_holder ? (
              <dl className="grid gap-4">
                <DetailField
                  label="Current Holder"
                  value={
                    <Link
                      href={`/employees/${typedAsset.current_holder.id}`}
                      className="text-primary hover:underline"
                    >
                      {typedAsset.current_holder.employee_name}
                    </Link>
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Holder recorded on asset but no active assignment entry found.
                </p>
              </dl>
            ) : (
              <EmptyState
                title="Not assigned"
                description="This asset is not currently assigned to any employee"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset History</CardTitle>
        </CardHeader>
        <CardContent>
          {typedHistory.length === 0 ? (
            <EmptyState title="No history" description="Asset movements and changes will appear here" />
          ) : (
            <div className="relative space-y-0">
              {typedHistory.map((item, index) => (
                <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {index < typedHistory.length - 1 && (
                    <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
                  )}
                  <div className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background" />
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.action} />
                      <span className="text-sm text-muted-foreground">{formatDateTime(item.date)}</span>
                    </div>
                    <div className="text-sm">
                      {item.employee && (
                        <p>
                          Employee:{" "}
                          <Link
                            href={`/employees/${item.employee_id}`}
                            className="text-primary hover:underline"
                          >
                            {item.employee.employee_name}
                          </Link>
                        </p>
                      )}
                      {(item.previous_holder || item.current_holder) && (
                        <p className="text-muted-foreground">
                          {item.previous_holder && (
                            <span>From {item.previous_holder.employee_name}</span>
                          )}
                          {item.previous_holder && item.current_holder && " → "}
                          {item.current_holder && (
                            <span>To {item.current_holder.employee_name}</span>
                          )}
                        </p>
                      )}
                      {item.remarks && <p className="mt-1">{item.remarks}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        By {item.performer?.full_name || "System"} · {capitalize(item.action)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

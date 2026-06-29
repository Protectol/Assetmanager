"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Copy, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, capitalize } from "@/lib/utils";
import type { Form, FormAsset, FormSubmission, Employee, Asset } from "@/types";

interface FormDetailClientProps {
  form: Form & {
    employee?: Employee;
    form_assets?: (FormAsset & { asset?: Asset; old_asset?: Asset })[];
    submission?: FormSubmission;
    fullLink: string;
  };
}

export function FormDetailClient({ form }: FormDetailClientProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(form.fullLink);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const isExchange = form.action_type === "exchange";
  const isVerification = form.action_type === "verification";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Form Details</h2>
          <p className="text-muted-foreground">
            {form.employee?.employee_name} — {capitalize(form.action_type)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status & Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <StatusBadge status={form.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Action:</span>
              <StatusBadge status={form.action_type} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm font-medium">{formatDateTime(form.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="text-sm font-medium">{formatDateTime(form.expires_at)}</p>
            </div>
            {form.submission && (
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-sm font-medium">{formatDateTime(form.submission.submitted_at)}</p>
              </div>
            )}
            {form.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{form.notes}</p>
              </div>
            )}

            {form.status === "pending" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Employee Form Link</p>
                <div className="flex gap-2">
                  <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">
                    {form.fullLink}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={form.fullLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                {copied && <p className="text-xs text-emerald-600">Copied!</p>}
              </div>
            )}

            {form.submission?.pdf_url && (
              <Button variant="outline" asChild>
                <a href={form.submission.pdf_url} download={`form-${form.id.slice(0, 8)}.pdf`}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee</CardTitle>
          </CardHeader>
          <CardContent>
            {form.employee && (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Name", form.employee.employee_name],
                  ["ID", form.employee.employee_id],
                  ["Department", form.employee.department],
                  ["Designation", form.employee.designation],
                  ["Location", form.employee.location],
                  ["Email", form.employee.email],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets ({form.form_assets?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {form.form_assets?.map((fa) => (
              <div key={fa.id} className="rounded-lg border p-4">
                {isExchange && fa.old_asset && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    Exchange: {fa.old_asset.asset_name} ({fa.old_asset.asset_tag}) →
                  </p>
                )}
                <p className="font-medium">{fa.asset?.asset_name}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Tag: {fa.asset?.asset_tag}</span>
                  {fa.asset?.serial_number && <span>SN: {fa.asset.serial_number}</span>}
                  {fa.condition && <span>Condition: {capitalize(fa.condition)}</span>}
                  {isVerification && fa.verified !== undefined && (
                    <span>Verified: {fa.verified ? "Yes" : "No"}</span>
                  )}
                </div>
                {fa.remarks && <p className="mt-2 text-sm text-muted-foreground">{fa.remarks}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

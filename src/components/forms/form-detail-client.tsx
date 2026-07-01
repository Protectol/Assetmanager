"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, ExternalLink, Download, CheckCircle2, XCircle,
  Loader2, Mail, Package, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDateTime, capitalize } from "@/lib/utils";
import type { Form, FormAsset, FormSubmission, Employee, Asset } from "@/types";

interface DeclaredAsset {
  category: string;
  has_asset: boolean;
  fields: Record<string, string>;
  condition: string;
  remarks: string;
}

interface FormDetailClientProps {
  form: Form & {
    employee?: Employee;
    form_assets?: (FormAsset & { asset?: Asset; old_asset?: Asset })[];
    submission?: FormSubmission;
    fullLink: string;
  };
  emailSettings?: {
    default_to: string;
    default_cc: string;
    subject_template: string;
    body_template: string;
  };
  adminName?: string;
}

export function FormDetailClient({ form, emailSettings, adminName }: FormDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [formStatus, setFormStatus] = useState(form.status);

  const isCurrentVerification = form.action_type === "current_verification";
  const isExchange = form.action_type === "exchange";
  const isVerification = form.action_type === "verification";

  const declaredAssets: DeclaredAsset[] =
    (form.submission?.submission_data as { declared_assets?: DeclaredAsset[] })?.declared_assets || [];

  const copyLink = async () => {
    await navigator.clipboard.writeText(form.fullLink);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");
      setFormStatus("approved");
      toast.success(`Approved! ${data.assets_created} asset(s) added to the register.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setRejecting(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/approve`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      setFormStatus("rejected");
      setShowRejectBox(false);
      toast.success("Form rejected and employee notified.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setRejecting(false);
    }
  };

  const handleSendEmail = () => {
    if (!form.employee || declaredAssets.length === 0) return;

    const emp = form.employee;
    const date = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric"
    });

    // Build asset details for email body (structured list to avoid alignment issues in proportional fonts)
    const assetTable = declaredAssets
      .filter(a => a.has_asset)
      .map((a, i) => {
        const sn = a.fields?.serial_number || a.fields?.imei || a.fields?.sim_number || "None";
        return `${i + 1}. ${a.category}: ${buildAssetName(a)}
   • Serial/ID: ${sn}
   • Condition: ${capitalize(a.condition || "good")}
   • Remarks: ${a.remarks || "None"}`;
      })
      .join("\n\n");

    const replacements: Record<string, string> = {
      "[Team Member Name]": emp.employee_name,
      "[Team Member ID]": emp.employee_id,
      "[Department]": emp.department,
      "[Designation]": emp.designation,
      "[Location]": emp.location,
      "[Asset Table]": assetTable,
      "[Admin Name]": adminName || "Admin",
      "[Date]": date,
    };

    const subject = Object.entries(replacements).reduce(
      (s, [k, v]) => s.replaceAll(k, v),
      emailSettings?.subject_template || `Asset Assignment Update - ${emp.employee_name} - ${emp.employee_id}`
    );

    const body = Object.entries(replacements).reduce(
      (s, [k, v]) => s.replaceAll(k, v),
      emailSettings?.body_template || ""
    );

    const to = emailSettings?.default_to || "";
    const cc = emailSettings?.default_cc || "";

    const mailto = `mailto:${encodeURIComponent(to)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forms"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Form Details</h2>
          <p className="text-muted-foreground">
            {form.employee?.employee_name} —{" "}
            {isCurrentVerification ? "Current Asset Verification" : capitalize(form.action_type)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status & Link */}
        <Card>
          <CardHeader><CardTitle>Status & Link</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <StatusBadge status={formStatus} />
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

            {formStatus === "pending" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Team Member Form Link</p>
                <div className="flex gap-2">
                  <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">{form.fullLink}</code>
                  <Button variant="outline" size="icon" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={form.fullLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                </div>
                {copied && <p className="text-xs text-emerald-600">Copied!</p>}
              </div>
            )}

            {form.submission?.pdf_url && (
              <Button variant="outline" asChild>
                <a href={form.submission.pdf_url} download={`form-${form.id.slice(0, 8)}.pdf`}>
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </Button>
            )}

            {/* Approve / Reject for current_verification */}
            {isCurrentVerification && formStatus === "completed" && (
              <div className="pt-2 border-t border-border space-y-3">
                <p className="text-sm font-semibold text-foreground">Admin Review</p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleApprove}
                    disabled={approving || rejecting}
                  >
                    {approving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setShowRejectBox(!showRejectBox)}
                    disabled={approving || rejecting}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </div>

                {showRejectBox && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label>Rejection Reason</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this is being rejected..."
                      rows={3}
                    />
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleReject}
                      disabled={rejecting}
                    >
                      {rejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Confirm Rejection
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Outlook Email Button — shown after approval */}
            {isCurrentVerification && formStatus === "approved" && (
              <div className="pt-2 border-t border-border">
                <div className="mb-2 flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-semibold">Approved — Assets added to register</span>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleSendEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Asset Assignment Email
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Opens Outlook compose with a pre-filled professional email template.
                </p>
              </div>
            )}

            {isCurrentVerification && formStatus === "rejected" && (
              <div className="flex items-center gap-2 text-destructive pt-2 border-t border-border">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">Form Rejected</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Info */}
        <Card>
          <CardHeader><CardTitle>Team Member</CardTitle></CardHeader>
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

      {/* Declared Assets (Current Verification) */}
      {isCurrentVerification && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Declared Assets ({declaredAssets.filter(a => a.has_asset).length})
            </CardTitle>
            <CardDescription>
              Assets the employee declared to be currently in their possession
            </CardDescription>
          </CardHeader>
          <CardContent>
            {declaredAssets.filter(a => a.has_asset).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No assets declared</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Category</th>
                      <th className="pb-2 pr-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Asset Name</th>
                      <th className="pb-2 pr-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Serial / ID</th>
                      <th className="pb-2 pr-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Condition</th>
                      <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {declaredAssets.filter(a => a.has_asset).map((a, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{a.category}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{buildAssetName(a)}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                          {a.fields?.serial_number || a.fields?.imei || a.fields?.sim_number || a.fields?.card_number || "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            a.condition === "new" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" :
                            a.condition === "good" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" :
                            a.condition === "damaged" ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" :
                            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}>
                            {capitalize(a.condition || "good")}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">{a.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {form.submission?.employee_signature && (
              <div className="mt-6 border-t pt-4">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Digital Signature</p>
                {form.submission.signature_type === "type" ? (
                  <p className="font-serif text-2xl text-foreground italic">{form.submission.employee_signature}</p>
                ) : (
                  <img
                    src={form.submission.employee_signature}
                    alt="Team Member Signature"
                    className="h-16 max-w-xs border rounded-md bg-white dark:bg-zinc-950 p-2"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Standard form assets (non current_verification) */}
      {!isCurrentVerification && (
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
      )}
    </div>
  );
}

function buildAssetName(declared: DeclaredAsset): string {
  const parts: string[] = [];
  if (declared.fields?.brand) parts.push(declared.fields.brand);
  if (declared.fields?.model) parts.push(declared.fields.model);
  if (declared.fields?.size) parts.push(`${declared.fields.size}"`);
  if (declared.fields?.type) parts.push(declared.fields.type);
  if (declared.fields?.network_provider) parts.push(declared.fields.network_provider);
  return parts.join(" ") || declared.category;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignaturePad } from "@/components/shared/signature-pad";
import { capitalize } from "@/lib/utils";
import { CurrentVerificationView, type DeclaredAsset } from "./current-verification-view";
import type { AssetCondition, FormActionType } from "@/types";

interface FormAssetData {
  id: string;
  asset_id: string;
  old_asset_id?: string;
  condition?: AssetCondition;
  remarks?: string;
  verified?: boolean;
  asset?: {
    id: string;
    asset_name: string;
    asset_type: string;
    asset_tag: string;
    serial_number?: string;
    brand?: string;
    model?: string;
    condition: AssetCondition;
  };
  old_asset?: {
    id: string;
    asset_name: string;
    asset_tag: string;
    serial_number?: string;
  };
}

interface EmployeeData {
  employee_name: string;
  employee_id: string;
  department: string;
  designation: string;
  location: string;
  email: string;
}

interface FormData {
  id: string;
  token: string;
  action_type: FormActionType;
  status: string;
  expires_at: string;
  notes?: string;
  employee: EmployeeData;
  form_assets: FormAssetData[];
  companyName?: string;
  companyLogoUrl?: string;
  assetCategories?: string[];
  assetRules?: Array<{
    condition: { category: string; value: string };
    requirement: { category: string; value: string };
  }>;
}

interface EmployeeFormViewProps {
  form: FormData;
  readOnly?: boolean;
}

const actionTitles: Record<FormActionType, string> = {
  onboarding: "Asset Handover",
  exchange: "Asset Exchange",
  return: "Asset Return / Clearance",
  verification: "Asset Verification",
  current_verification: "Current Asset Declaration",
};

const actionDescriptions: Record<FormActionType, string> = {
  onboarding: "Please review the assets below and sign to confirm receipt.",
  exchange: "Please review the asset exchange details and sign to confirm.",
  return: "Please confirm the return of the listed assets and their condition.",
  verification: "Please verify the assets assigned to you and report any discrepancies.",
  current_verification: "Please declare all company assets currently in your possession.",
};

export function EmployeeFormView({ form, readOnly = false }: EmployeeFormViewProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(form.status === "completed");
  const [signature, setSignature] = useState("");
  const [signatureType, setSignatureType] = useState<"draw" | "type">("draw");
  const [assetData, setAssetData] = useState<Record<string, Partial<FormAssetData>>>(() => {
    const initial: Record<string, Partial<FormAssetData>> = {};
    form.form_assets.forEach((fa) => {
      initial[fa.id] = {
        condition: fa.condition || fa.asset?.condition || "good",
        remarks: fa.remarks || "",
        verified: fa.verified ?? true,
      };
    });
    return initial;
  });
  const [dynamicAssets, setDynamicAssets] = useState<DeclaredAsset[]>([]);
  const [isDynamicValid, setIsDynamicValid] = useState(false);

  const isExpired = form.status === "expired" || new Date(form.expires_at) < new Date();
  const isDisabled = readOnly || submitted || isExpired || form.status !== "pending";

  const updateAsset = (id: string, field: string, value: string | boolean) => {
    setAssetData((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!signature) {
      toast.error("Please provide your signature");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/forms/public/${form.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature,
          signatureType,
          assets: form.action_type === "current_verification" ? [] : form.form_assets.map((fa) => ({
            id: fa.id,
            condition: assetData[fa.id]?.condition,
            remarks: assetData[fa.id]?.remarks,
            verified: assetData[fa.id]?.verified,
          })),
          submission_data: form.action_type === "current_verification" ? {
            declared_assets: dynamicAssets.filter(a => a.has_asset)
          } : undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit form");
        return;
      }

      setSubmitted(true);
      toast.success("Form submitted successfully");
      router.refresh();
    } catch {
      toast.error("An error occurred while submitting");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground transition-colors duration-300 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 text-center shadow-lg relative z-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 shadow-sm border border-emerald-100 dark:border-emerald-900/20">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Form Submitted</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Thank you, <span className="font-semibold text-foreground">{form.employee.employee_name}</span>. Your {actionTitles[form.action_type].toLowerCase()} form has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground transition-colors duration-300 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-destructive/5 to-transparent pointer-events-none" />
        <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 text-center shadow-lg relative z-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-sm border border-destructive/20">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Link Expired</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            This secure form link has expired. Please contact your IT or HR department to generate a new verification link.
          </p>
        </div>
      </div>
    );
  }

  const isExchange = form.action_type === "exchange";
  const isVerification = form.action_type === "verification";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground transition-colors duration-300 relative overflow-hidden">
      {/* Premium subtle background glow */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent pointer-events-none dark:from-primary/20 dark:via-primary/[0.05]" />
      
      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-8 sm:mb-10 text-center flex flex-col items-center">
          {form.companyLogoUrl ? (
            <div className="mb-4 p-2 sm:p-2.5 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-border/40 inline-flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.companyLogoUrl}
                alt={form.companyName || "Company logo"}
                className="h-10 sm:h-12 w-auto object-contain max-w-[160px] sm:max-w-[200px]"
              />
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-lg sm:text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20 ring-4 ring-background">
              {(form.companyName || "C").charAt(0)}
            </div>
          )}
          
          {/* Only display text name if logo is absent or as secondary branding */}
          {!form.companyLogoUrl && (
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-muted-foreground">{form.companyName}</h1>
          )}
          
          <h2 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            {actionTitles[form.action_type]}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed px-2">
            {actionDescriptions[form.action_type]}
          </p>
        </div>

        {/* Employee Details */}
        <div className="mb-6 rounded-2xl border border-border/60 bg-white dark:bg-zinc-900/80 p-5 sm:p-6 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            Employee Information
          </h3>
          <div className="grid gap-x-4 gap-y-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Name", form.employee.employee_name],
              ["Employee ID", form.employee.employee_id],
              ["Email Address", form.employee.email],
              ["Department", form.employee.department],
              ["Designation", form.employee.designation],
              ["Work Location", form.employee.location],
            ].map(([label, value]) => (
              <div key={label} className="space-y-1 bg-slate-50/50 dark:bg-zinc-800/30 p-2.5 rounded-lg border border-border/40">
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-foreground tracking-tight break-words">{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Assets */}
        {form.action_type === "current_verification" ? (
          <div className="mb-6">
            <CurrentVerificationView
              categories={form.assetCategories || []}
              rules={form.assetRules || []}
              disabled={isDisabled}
              onDataChange={(assets, isValid) => {
                setDynamicAssets(assets);
                setIsDynamicValid(isValid);
              }}
            />
          </div>
        ) : (
        <div className="mb-6 rounded-2xl border border-border/60 bg-white dark:bg-zinc-900/80 p-5 sm:p-6 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            {isExchange ? "Asset Exchange Details" : "Asset Details"}
          </h3>
          <div className="space-y-6">
            {form.form_assets.map((fa) => (
              <div key={fa.id} className="rounded-xl border border-border/60 bg-slate-50/50 dark:bg-zinc-800/30 p-4 sm:p-5 space-y-4 shadow-sm">
                
                {isExchange && fa.old_asset ? (
                  <div className="grid gap-4 md:grid-cols-2 items-stretch">
                    {/* Returning Card */}
                    <div className="rounded-lg border border-red-200/40 bg-red-50/20 dark:bg-red-950/10 dark:border-red-900/30 p-4 relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="inline-block px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-bold rounded uppercase tracking-wide mb-2">
                          Returning
                        </div>
                        <p className="text-sm font-bold text-foreground">{fa.old_asset.asset_name}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-border/50 text-[10px] font-mono text-muted-foreground">
                          Tag: {fa.old_asset.asset_tag}
                        </span>
                        {fa.old_asset.serial_number && (
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-border/50 text-[10px] font-mono text-muted-foreground">
                            SN: {fa.old_asset.serial_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Receiving Card */}
                    <div className="rounded-lg border border-emerald-200/40 bg-emerald-50/15 dark:bg-emerald-950/10 dark:border-emerald-900/30 p-4 relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="inline-block px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded uppercase tracking-wide mb-2">
                          Receiving
                        </div>
                        <p className="text-sm font-bold text-foreground">{fa.asset?.asset_name}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-border/50 text-[10px] font-mono text-muted-foreground">
                          Tag: {fa.asset?.asset_tag}
                        </span>
                        {fa.asset?.serial_number && (
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-border/50 text-[10px] font-mono text-muted-foreground">
                            SN: {fa.asset.serial_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard single asset display */
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-base font-bold text-foreground tracking-tight">
                        {fa.asset?.asset_name}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-muted border border-border/60 text-[10px] font-mono font-medium text-muted-foreground">
                          Tag: {fa.asset?.asset_tag}
                        </span>
                        {fa.asset?.serial_number && (
                          <span className="px-2 py-0.5 rounded-md bg-muted border border-border/60 text-[10px] font-mono font-medium text-muted-foreground">
                            SN: {fa.asset.serial_number}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-muted border border-border/60 text-[10px] font-medium text-muted-foreground">
                          {fa.asset?.asset_type}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status validation fields */}
                <div className="pt-4 border-t border-border/40 space-y-4">
                  {isVerification && (
                    <div className="flex items-center space-x-2.5 bg-muted/40 p-3 rounded-lg border border-border/40">
                      <Checkbox
                        id={`verified-${fa.id}`}
                        checked={assetData[fa.id]?.verified ?? true}
                        onCheckedChange={(checked) => updateAsset(fa.id, "verified", !!checked)}
                        disabled={isDisabled}
                        className="h-4 w-4 rounded border-input"
                      />
                      <Label htmlFor={`verified-${fa.id}`} className="text-sm font-semibold leading-none cursor-pointer select-none">
                        I confirm this asset is in my possession and details are correct
                      </Label>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">Reported Condition</Label>
                      <Select
                        value={assetData[fa.id]?.condition || "good"}
                        onValueChange={(v) => updateAsset(fa.id, "condition", v)}
                        disabled={isDisabled}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-border/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["new", "good", "damaged", "lost"] as AssetCondition[]).map((c) => (
                            <SelectItem key={c} value={c}>
                              {capitalize(c)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">Additional Remarks</Label>
                      <Textarea
                        placeholder="e.g. Minor scratches, missing cables, etc. (optional)"
                        value={assetData[fa.id]?.remarks || ""}
                        onChange={(e) => updateAsset(fa.id, "remarks", e.target.value)}
                        disabled={isDisabled}
                        rows={1}
                        className="min-h-[38px] py-2 bg-white dark:bg-zinc-900 border-border/80 resize-none text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
        )}

        {form.notes && (
          <div className="mb-6 rounded-2xl border border-amber-200/40 bg-amber-50/35 dark:bg-amber-950/10 dark:border-amber-900/30 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Notes from IT/HR</p>
            <p className="mt-1.5 text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-medium">{form.notes}</p>
          </div>
        )}

        {/* Signature */}
        {form.action_type === "current_verification" && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-5 sm:p-6 shadow-sm">
            <h4 className="font-bold text-foreground mb-2">Employee Acknowledgement</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              &quot;I confirm that the above company assets are currently in my possession and the information provided is accurate to the best of my knowledge. I understand that these assets remain company property and must be returned upon request or at the time of separation.&quot;
            </p>
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-border/60 bg-white dark:bg-zinc-900/80 p-4 sm:p-6 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
          <SignaturePad
            onSignatureChange={(sig, type) => {
              setSignature(sig);
              setSignatureType(type);
            }}
            disabled={isDisabled}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pb-12">
          <Button
            size="lg"
            className="min-w-[240px] h-12 text-sm font-semibold tracking-wide rounded-xl bg-primary hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-primary/10"
            onClick={handleSubmit}
            disabled={isDisabled || submitting || !signature || (!isDynamicValid && form.action_type === "current_verification")}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Form...
              </>
            ) : (
              "Submit Verification Form"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

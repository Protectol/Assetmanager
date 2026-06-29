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
};

const actionDescriptions: Record<FormActionType, string> = {
  onboarding: "Please review the assets below and sign to confirm receipt.",
  exchange: "Please review the asset exchange details and sign to confirm.",
  return: "Please confirm the return of the listed assets and their condition.",
  verification: "Please verify the assets assigned to you and report any discrepancies.",
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
          assets: form.form_assets.map((fa) => ({
            id: fa.id,
            condition: assetData[fa.id]?.condition,
            remarks: assetData[fa.id]?.remarks,
            verified: assetData[fa.id]?.verified,
          })),
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Form Submitted</h1>
          <p className="mt-2 text-slate-600">
            Thank you, {form.employee.employee_name}. Your {actionTitles[form.action_type].toLowerCase()} form has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-semibold text-slate-900">Form Expired</h1>
          <p className="mt-2 text-slate-600">
            This form link has expired. Please contact your IT or HR department for a new link.
          </p>
        </div>
      </div>
    );
  }

  const isExchange = form.action_type === "exchange";
  const isVerification = form.action_type === "verification";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          {form.companyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.companyLogoUrl}
              alt={form.companyName || "Company"}
              className="mx-auto mb-4 h-12 object-contain"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              {(form.companyName || "C").charAt(0)}
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{form.companyName}</h1>
          <h2 className="mt-2 text-lg font-medium text-slate-700">{actionTitles[form.action_type]}</h2>
          <p className="mt-1 text-sm text-slate-500">{actionDescriptions[form.action_type]}</p>
        </div>

        {/* Employee Details */}
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Employee Information
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Name", form.employee.employee_name],
              ["Employee ID", form.employee.employee_id],
              ["Department", form.employee.department],
              ["Designation", form.employee.designation],
              ["Location", form.employee.location],
              ["Email", form.employee.email],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Assets */}
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {isExchange ? "Asset Exchange Details" : "Assets"}
          </h3>
          <div className="space-y-4">
            {form.form_assets.map((fa) => (
              <div key={fa.id} className="rounded-xl border border-slate-200 p-4">
                {isExchange && fa.old_asset && (
                  <div className="mb-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">Returning</p>
                    <p className="text-sm font-medium">{fa.old_asset.asset_name}</p>
                    <p className="text-xs text-slate-500">Tag: {fa.old_asset.asset_tag}</p>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {isExchange ? "Receiving" : ""} {fa.asset?.asset_name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Tag: {fa.asset?.asset_tag}</span>
                      {fa.asset?.serial_number && <span>SN: {fa.asset.serial_number}</span>}
                      <span>Type: {fa.asset?.asset_type}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {isVerification && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Checkbox
                        id={`verified-${fa.id}`}
                        checked={assetData[fa.id]?.verified ?? true}
                        onCheckedChange={(checked) => updateAsset(fa.id, "verified", !!checked)}
                        disabled={isDisabled}
                      />
                      <Label htmlFor={`verified-${fa.id}`} className="text-sm">
                        I confirm this asset is in my possession
                      </Label>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Condition</Label>
                    <Select
                      value={assetData[fa.id]?.condition || "good"}
                      onValueChange={(v) => updateAsset(fa.id, "condition", v)}
                      disabled={isDisabled}
                    >
                      <SelectTrigger className="mt-1">
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
                    <Label className="text-xs">Remarks</Label>
                    <Textarea
                      className="mt-1"
                      placeholder="Optional remarks..."
                      value={assetData[fa.id]?.remarks || ""}
                      onChange={(e) => updateAsset(fa.id, "remarks", e.target.value)}
                      disabled={isDisabled}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {form.notes && (
          <div className="mb-6 rounded-2xl border bg-amber-50 p-4">
            <p className="text-xs font-medium text-amber-800">Notes from IT/HR</p>
            <p className="mt-1 text-sm text-amber-900">{form.notes}</p>
          </div>
        )}

        {/* Signature */}
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <SignaturePad
            onSignatureChange={(sig, type) => {
              setSignature(sig);
              setSignatureType(type);
            }}
            disabled={isDisabled}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-center pb-8">
          <Button
            size="lg"
            className="min-w-[200px]"
            onClick={handleSubmit}
            disabled={isDisabled || submitting || !signature}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Form"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

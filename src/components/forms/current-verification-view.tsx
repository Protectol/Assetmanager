"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, AlertCircle, ShieldCheck, ShieldX } from "lucide-react";
import { capitalize } from "@/lib/utils";
import type { AssetCondition } from "@/types";

// Grammatically correct question per category
const CATEGORY_QUESTIONS: Record<string, string> = {
  Laptop: "Do you have a company-issued laptop?",
  "Laptop Charger": "Do you have a company-issued laptop charger / adapter?",
  Mouse: "Do you have a company-issued mouse?",
  Keyboard: "Do you have a company-issued keyboard?",
  Monitor: "Do you have a company-issued monitor?",
  Tablet: "Do you have a company-issued tablet?",
  "Mobile Phone": "Do you have a company-issued mobile phone?",
  "SIM Card": "Do you have a company-issued SIM card?",
  "Access Card": "Do you have a company-issued access card?",
};

// Standard fields requested by user per category
const CATEGORY_TEMPLATES: Record<string, { name: string; label: string; required: boolean }[]> = {
  Laptop: [
    { name: "brand", label: "Laptop Brand", required: true },
    { name: "model", label: "Laptop Model", required: true },
    { name: "asset_tag", label: "Asset Tag (if available)", required: false },
    { name: "serial_number", label: "Serial Number", required: true },
  ],
  "Laptop Charger": [
    { name: "brand", label: "Charger Brand (if available)", required: false },
    { name: "serial_number", label: "Number / Serial / ID (if available)", required: false },
  ],
  Mouse: [
    { name: "type", label: "Mouse Type", required: true },
    { name: "serial_number", label: "Serial / ID (if available)", required: false },
  ],
  Keyboard: [
    { name: "type", label: "Keyboard Type", required: true },
    { name: "serial_number", label: "Serial / ID (if available)", required: false },
  ],
  Monitor: [
    { name: "brand", label: "Monitor Brand", required: true },
    { name: "size", label: "Monitor Size", required: true },
    { name: "serial_number", label: "Serial Number", required: true },
    { name: "asset_tag", label: "Asset Tag (if available)", required: false },
  ],
  Tablet: [
    { name: "brand", label: "Tablet Brand", required: true },
    { name: "model", label: "Model", required: true },
    { name: "serial_number", label: "Serial Number / IMEI", required: true },
    { name: "asset_tag", label: "Asset Tag (if available)", required: false },
  ],
  "Mobile Phone": [
    { name: "brand", label: "Brand", required: true },
    { name: "model", label: "Model", required: true },
    { name: "imei", label: "IMEI", required: true },
    { name: "serial_number", label: "Serial Number", required: true },
  ],
  "SIM Card": [
    { name: "sim_number", label: "SIM Number", required: true },
    { name: "mobile_number", label: "Mobile Number", required: true },
    { name: "network_provider", label: "Network Provider", required: true },
  ],
  "Access Card": [
    { name: "card_number", label: "Card Number", required: true },
  ],
};

const DEFAULT_FIELDS = [
  { name: "asset_name", label: "Asset Name", required: true },
  { name: "serial_number", label: "Serial Number / ID", required: false },
];

export interface DeclaredAsset {
  id: string; // temporary local id
  category: string;
  has_asset: boolean;
  fields: Record<string, string>;
  condition: AssetCondition | "";
  remarks: string;
  isCustom?: boolean;
  k7_installed?: boolean | null; // null = not answered, true = yes, false = no
  k7_reason?: string;
}

interface CurrentVerificationViewProps {
  categories: string[];
  rules: Array<{
    condition: { category: string; value: string };
    requirement: { category: string; value: string };
  }>;
  onDataChange: (data: DeclaredAsset[], isValid: boolean) => void;
  disabled?: boolean;
}

export function CurrentVerificationView({ categories, rules, onDataChange, disabled }: CurrentVerificationViewProps) {
  const [assets, setAssets] = useState<DeclaredAsset[]>(() => {
    // Initialize standard categories
    return categories.map((cat, idx) => ({
      id: `default-${idx}`,
      category: cat,
      has_asset: false,
      fields: {},
      condition: "good",
      remarks: "",
    }));
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateAndPropagate = (newAssets: DeclaredAsset[]) => {
    const errors: string[] = [];

    // Check mandatory rules (e.g. if Laptop=Yes -> Charger=Yes)
    rules.forEach((rule) => {
      const conditionAsset = newAssets.find((a) => a.category === rule.condition.category);
      const requirementAsset = newAssets.find((a) => a.category === rule.requirement.category);

      if (
        conditionAsset?.has_asset === (rule.condition.value === "Yes") &&
        requirementAsset?.has_asset !== (rule.requirement.value === "Yes")
      ) {
        errors.push(`Rule violation: If ${rule.condition.category} is ${rule.condition.value}, then ${rule.requirement.category} must be ${rule.requirement.value}.`);
      }
    });

    // Check required fields for any asset marked as 'Yes'
    newAssets.forEach((asset) => {
      if (asset.has_asset) {
        const template = CATEGORY_TEMPLATES[asset.category] || DEFAULT_FIELDS;
        
        // Custom assets also need a category explicitly set
        if (asset.isCustom && !asset.category.trim()) {
           errors.push(`Please specify the Asset Category for custom item.`);
        }

        template.forEach((field) => {
          if (field.required && !asset.fields[field.name]?.trim()) {
             errors.push(`Missing required field: ${field.label} for ${asset.category || 'New Asset'}`);
          }
        });
        
        if (!asset.condition && asset.category !== "SIM Card") {
           errors.push(`Please select a condition for ${asset.category}`);
        }

        // K7 validation for Laptop
        if (asset.category === "Laptop") {
          if (asset.k7_installed === null || asset.k7_installed === undefined) {
            errors.push(`Please indicate whether K7 Security Software is installed on the Laptop.`);
          } else if (asset.k7_installed === false && !asset.k7_reason?.trim()) {
            errors.push(`Please provide a reason why K7 Security Software is not installed on the Laptop.`);
          }
        }
      }
    });

    setValidationErrors(errors);
    onDataChange(newAssets, errors.length === 0);
  };

  const updateAsset = (id: string, updates: Partial<DeclaredAsset>) => {
    const newAssets = assets.map((a) => (a.id === id ? { ...a, ...updates } : a));
    setAssets(newAssets);
    validateAndPropagate(newAssets);
  };

  const updateField = (id: string, fieldName: string, value: string) => {
    const newAssets = assets.map((a) => {
      if (a.id === id) {
        return { ...a, fields: { ...a.fields, [fieldName]: value } };
      }
      return a;
    });
    setAssets(newAssets);
    validateAndPropagate(newAssets);
  };

  const addCustomAsset = () => {
    const newAssets = [
      ...assets,
      {
        id: `custom-${Date.now()}`,
        category: "",
        has_asset: true,
        fields: {},
        condition: "good",
        remarks: "",
        isCustom: true,
      } as DeclaredAsset,
    ];
    setAssets(newAssets);
    validateAndPropagate(newAssets);
  };

  const removeCustomAsset = (id: string) => {
    const newAssets = assets.filter((a) => a.id !== id);
    setAssets(newAssets);
    validateAndPropagate(newAssets);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-white dark:bg-zinc-900/80 p-4 sm:p-6 shadow-sm relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
        <h3 className="mb-5 sm:mb-6 text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
          Asset Declaration Questionnaire
        </h3>

        <div className="space-y-6 sm:space-y-8">
          {assets.map((asset) => {
            const isStandard = !asset.isCustom;
            const template = CATEGORY_TEMPLATES[asset.category] || DEFAULT_FIELDS;

            return (
              <div key={asset.id} className={`rounded-xl border transition-colors ${asset.has_asset ? 'border-primary/50 bg-primary/5 dark:bg-primary/10' : 'border-border/60 bg-slate-50/50 dark:bg-zinc-800/30'} p-4 sm:p-5 space-y-4 shadow-sm`}>
                
                {isStandard ? (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`has-${asset.id}`}
                      checked={asset.has_asset}
                      onCheckedChange={(c) => updateAsset(asset.id, { has_asset: !!c })}
                      disabled={disabled}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`has-${asset.id}`} className="text-base font-semibold leading-none cursor-pointer">
                      {CATEGORY_QUESTIONS[asset.category] ?? `Do you have a company-issued ${asset.category}?`}
                    </Label>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <Label className="text-xs font-bold text-muted-foreground mb-1 block">Asset Category</Label>
                      <Input
                        placeholder="e.g. Headset, External Drive"
                        value={asset.category}
                        onChange={(e) => updateAsset(asset.id, { category: e.target.value })}
                        disabled={disabled}
                        className="bg-white dark:bg-zinc-900 border-border/60"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeCustomAsset(asset.id)} disabled={disabled}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {asset.has_asset && (
                  <div className="pt-4 border-t border-border/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {template.map((field) => (
                        <div key={field.name} className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </Label>
                          <Input
                            value={asset.fields[field.name] || ""}
                            onChange={(e) => updateField(asset.id, field.name, e.target.value)}
                            disabled={disabled}
                            className="bg-white dark:bg-zinc-900 border-border/60"
                          />
                        </div>
                      ))}
                    </div>

                    {/* K7 Security Software — Laptop only */}
                    {asset.category === "Laptop" && (
                      <div className="rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50/60 dark:bg-violet-950/20 p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                          <Label className="text-sm font-bold text-violet-800 dark:text-violet-300">
                            K7 Security Software <span className="text-destructive">*</span>
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground -mt-1">Is K7 Total Security / K7 Antivirus installed on this laptop?</p>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => updateAsset(asset.id, { k7_installed: true, k7_reason: "" })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all focus:outline-none
                              ${asset.k7_installed === true
                                ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                                : "border-border bg-white dark:bg-zinc-900 text-muted-foreground hover:border-emerald-400 hover:text-emerald-600"}
                            `}
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Yes, Installed
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => updateAsset(asset.id, { k7_installed: false })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all focus:outline-none
                              ${asset.k7_installed === false
                                ? "border-destructive bg-destructive text-white shadow-sm"
                                : "border-border bg-white dark:bg-zinc-900 text-muted-foreground hover:border-destructive/60 hover:text-destructive"}
                            `}
                          >
                            <ShieldX className="h-4 w-4" />
                            No, Not Installed
                          </button>
                        </div>
                        {asset.k7_installed === false && (
                          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            <Label className="text-xs font-bold text-destructive">
                              Reason why K7 is not installed <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                              placeholder="Please explain why K7 Security Software is not installed..."
                              value={asset.k7_reason || ""}
                              onChange={(e) => updateAsset(asset.id, { k7_reason: e.target.value })}
                              disabled={disabled}
                              rows={2}
                              className="min-h-[60px] bg-white dark:bg-zinc-900 border-destructive/40 focus:border-destructive resize-none"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {asset.category !== "SIM Card" && (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                          <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">Condition <span className="text-destructive">*</span></Label>
                          <Select
                            value={asset.condition}
                            onValueChange={(v) => updateAsset(asset.id, { condition: v as AssetCondition })}
                            disabled={disabled}
                          >
                          <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-border/60">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                              {(["new", "good", "damaged", "lost"] as AssetCondition[]).map((c) => (
                                <SelectItem key={c} value={c}>{capitalize(c)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">Remarks</Label>
                          <Textarea
                            placeholder="Optional remarks..."
                            value={asset.remarks}
                            onChange={(e) => updateAsset(asset.id, { remarks: e.target.value })}
                            disabled={disabled}
                            rows={1}
                            className="min-h-[38px] bg-white dark:bg-zinc-900 border-border/60 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={addCustomAsset}
            disabled={disabled}
            className="w-full border-dashed border-2 py-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Other Asset
          </Button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-destructive mr-3 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-destructive">Please resolve the following before submitting:</p>
              <ul className="list-disc pl-5 text-sm text-destructive/90 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

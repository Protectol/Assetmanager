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
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { capitalize } from "@/lib/utils";
import type { AssetCondition } from "@/types";

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
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
        <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Asset Declaration Questionnaire
        </h3>

        <div className="space-y-8">
          {assets.map((asset) => {
            const isStandard = !asset.isCustom;
            const template = CATEGORY_TEMPLATES[asset.category] || DEFAULT_FIELDS;

            return (
              <div key={asset.id} className={`rounded-xl border transition-colors ${asset.has_asset ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-background/50'} p-5 space-y-4`}>
                
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
                      Do you have a company {asset.category}?
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
                        className="bg-background"
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
                            className="bg-background"
                          />
                        </div>
                      ))}
                    </div>

                    {asset.category !== "SIM Card" && (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                          <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">Condition <span className="text-destructive">*</span></Label>
                          <Select
                            value={asset.condition}
                            onValueChange={(v) => updateAsset(asset.id, { condition: v as AssetCondition })}
                            disabled={disabled}
                          >
                            <SelectTrigger className="w-full bg-background">
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
                            className="min-h-[38px] bg-background resize-none"
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

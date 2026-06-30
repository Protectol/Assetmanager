"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Asset, FormActionType } from "@/types";
import { capitalize } from "@/lib/utils";

const ACTION_LABELS: Record<FormActionType, string> = {
  onboarding: "Onboarding",
  exchange: "Exchange",
  return: "Return",
  verification: "Verification",
  current_verification: "Current Asset Verification",
};

interface GenerateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  actionType: FormActionType;
  availableAssets: Asset[];
  currentAssets: Asset[];
}

export function GenerateFormDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  actionType,
  availableAssets,
  currentAssets,
}: GenerateFormDialogProps) {
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [oldAssetIds, setOldAssetIds] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const assetsToSelect =
    actionType === "onboarding" || actionType === "exchange"
      ? availableAssets
      : currentAssets;

  useEffect(() => {
    if (!open) {
      setSelectedAssetIds([]);
      setOldAssetIds({});
      setNotes("");
      setGeneratedLink(null);
      setCopied(false);
    } else if (actionType === "verification" && currentAssets.length > 0) {
      setSelectedAssetIds(currentAssets.map((asset) => asset.id));
    }
  }, [open, actionType, currentAssets]);

  function toggleAsset(assetId: string) {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  }

  async function handleGenerate() {
    if (selectedAssetIds.length === 0 && actionType !== "current_verification") {
      toast.error("Please select at least one asset");
      return;
    }

    if (actionType === "exchange") {
      const missingOldAsset = selectedAssetIds.some((id) => !oldAssetIds[id]);
      if (missingOldAsset) {
        toast.error("Please select the asset being replaced for each new asset");
        return;
      }
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          actionType,
          assetIds: selectedAssetIds,
          oldAssetIds:
            actionType === "exchange"
              ? selectedAssetIds.map((id) => oldAssetIds[id])
              : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate form link");
      }

      const fullLink = `${window.location.origin}${data.link}`;
      setGeneratedLink(fullLink);
      toast.success("Form link generated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate form";
      toast.error("Could not generate form link", { description: message });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate {ACTION_LABELS[actionType]} Form</DialogTitle>
          <DialogDescription>
            Create a secure form link for {employeeName} to complete the{" "}
            {ACTION_LABELS[actionType].toLowerCase()} process.
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="mb-2 text-sm font-medium">Form link ready</p>
              <p className="break-all text-sm text-muted-foreground">{generatedLink}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {actionType === "current_verification" ? (
                <div className="rounded-md border p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    This will generate a link for the employee to declare all company assets currently in their possession. No assets need to be pre-selected.
                  </p>
                </div>
              ) : (
                <>
                  <Label>
                    {actionType === "onboarding"
                      ? "Select assets to assign"
                      : actionType === "exchange"
                        ? "Select new assets"
                        : actionType === "return"
                          ? "Select assets to return"
                          : "Assets to verify"}
                  </Label>

                  {assetsToSelect.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {actionType === "onboarding" || actionType === "exchange"
                        ? "No available assets found."
                        : "This employee has no assigned assets."}
                    </p>
                  ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                  {assetsToSelect.map((asset) => (
                    <div key={asset.id} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`asset-${asset.id}`}
                          checked={selectedAssetIds.includes(asset.id)}
                          onCheckedChange={() => toggleAsset(asset.id)}
                        />
                        <label
                          htmlFor={`asset-${asset.id}`}
                          className="flex-1 cursor-pointer text-sm leading-tight"
                        >
                          <span className="font-medium">{asset.asset_name}</span>
                          <span className="mt-0.5 block text-muted-foreground">
                            {asset.asset_tag}
                            {asset.serial_number ? ` · ${asset.serial_number}` : ""}
                          </span>
                          <StatusBadge status={asset.status} className="mt-1" />
                        </label>
                      </div>

                      {actionType === "exchange" && selectedAssetIds.includes(asset.id) && (
                        <div className="ml-7 space-y-1">
                          <Label className="text-xs text-muted-foreground">Replacing asset</Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={oldAssetIds[asset.id] || ""}
                            onChange={(e) =>
                              setOldAssetIds((prev) => ({
                                ...prev,
                                [asset.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">Select asset to replace</option>
                            {currentAssets.map((current) => (
                              <option key={current.id} value={current.id}>
                                {current.asset_name} ({current.asset_tag})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any instructions for the employee..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (assetsToSelect.length === 0 && actionType !== "current_verification")}
              >
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate Link
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface EmployeeActionButtonsProps {
  employeeId: string;
  employeeName: string;
  availableAssets: Asset[];
  currentAssets: Asset[];
}

export function EmployeeActionButtons({
  employeeId,
  employeeName,
  availableAssets,
  currentAssets,
}: EmployeeActionButtonsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<FormActionType>("onboarding");

  const actions: FormActionType[] = ["onboarding", "exchange", "return", "verification", "current_verification"];

  function openDialog(actionType: FormActionType) {
    setActiveAction(actionType);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button key={action} variant="outline" size="sm" onClick={() => openDialog(action)}>
            {capitalize(action)}
          </Button>
        ))}
      </div>

      <GenerateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employeeId={employeeId}
        employeeName={employeeName}
        actionType={activeAction}
        availableAssets={availableAssets}
        currentAssets={currentAssets}
      />
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImportPreviewTable } from "@/components/employees/import-preview-table";
import type { ImportPreviewRow } from "@/types";

export function EmployeeImportDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    newCount: number;
    updateCount: number;
    invalidCount: number;
    duplicateCount: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, startTransition] = useTransition();

  function resetState() {
    setStep("upload");
    setFile(null);
    setPreviewRows([]);
    setSummary(null);
    setIsLoading(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("dry_run", "true");

      const res = await fetch("/api/employees/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse import file");

      setPreviewRows(data.previewRows);
      setSummary(data.summary);
      setStep("preview");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Invalid Excel file format");
    } finally {
      setIsLoading(false);
    }
  }

  function handleConfirmImport() {
    if (!file) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("dry_run", "false");

        const res = await fetch("/api/employees/import", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Import failed");

        setSummary(data.summary);
        setStep("result");
        toast.success(`Import complete! Created ${data.summary.newCount} new, updated ${data.summary.updateCount} employees.`);
      } catch (err: unknown) {
        toast.error((err as Error).message || "Import execution failed");
      }
    });
  }

  async function handleDownloadTemplate() {
    window.open("/api/employees/export", "_blank");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Employees
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Employee Import & Synchronization
          </DialogTitle>
          <DialogDescription>
            Import or update employees using the standardized Excel template. Existing IDs update records, blank IDs create new records.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-center rounded-lg border bg-muted/40 p-4 text-sm">
              <div>
                <p className="font-semibold">Need the official template?</p>
                <p className="text-muted-foreground text-xs">Download all current employees pre-filled in Excel format.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5">
                <Download className="h-4 w-4" />
                Download Excel Template
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center hover:bg-muted/20 transition-colors">
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">Click or drag Excel file (.xlsx) here</p>
              <p className="text-xs text-muted-foreground mb-4">Supports up to thousands of employee records</p>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                id="excel-upload"
                onChange={handleFileSelect}
                disabled={isLoading}
              />
              <Button asChild disabled={isLoading}>
                <label htmlFor="excel-upload" className="cursor-pointer">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Parsing Excel...
                    </>
                  ) : (
                    "Select Excel File"
                  )}
                </label>
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && summary && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="rounded-lg border bg-emerald-500/10 p-3">
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{summary.newCount}</div>
                <div className="text-xs text-muted-foreground font-medium">New Employees</div>
              </div>
              <div className="rounded-lg border bg-blue-500/10 p-3">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary.updateCount}</div>
                <div className="text-xs text-muted-foreground font-medium">To Update</div>
              </div>
              <div className="rounded-lg border bg-red-500/10 p-3">
                <div className="text-xl font-bold text-red-600 dark:text-red-400">{summary.invalidCount}</div>
                <div className="text-xs text-muted-foreground font-medium">Invalid Rows</div>
              </div>
              <div className="rounded-lg border bg-amber-500/10 p-3">
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary.duplicateCount}</div>
                <div className="text-xs text-muted-foreground font-medium">Duplicates</div>
              </div>
            </div>

            <ImportPreviewTable rows={previewRows} />
          </div>
        )}

        {step === "result" && summary && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            <h3 className="text-xl font-bold">Import Executed Successfully!</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Processed {summary.total} total rows. Added {summary.newCount} new employees and updated {summary.updateCount} existing employee records.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={resetState} disabled={isImporting}>
                Back / Change File
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={isImporting || (summary?.newCount === 0 && summary?.updateCount === 0)}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing Import...
                  </>
                ) : (
                  `Confirm & Import (${(summary?.newCount || 0) + (summary?.updateCount || 0)} Records)`
                )}
              </Button>
            </>
          )}
          {step === "result" && (
            <Button
              onClick={() => {
                setOpen(false);
                window.location.reload();
              }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

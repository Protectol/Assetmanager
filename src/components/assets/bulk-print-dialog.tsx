"use client";

import { useState } from "react";
import { Printer, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import type { Asset } from "@/types";

interface BulkPrintDialogProps {
  selectedAssets: Asset[];
  disabled?: boolean;
  companyName?: string;
}

export function BulkPrintDialog({ selectedAssets, disabled, companyName = "Protectol Health" }: BulkPrintDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  async function handleExecuteBulkPrint() {
    if (selectedAssets.length === 0) return;
    setIsPrinting(true);

    try {
      // Generate QR Data URLs client-side — no API call needed
      const QRCode = await import("qrcode");
      const appUrl = window.location.origin;
      const qrMap: Record<string, string> = {};
      await Promise.all(
        selectedAssets.map(async (asset) => {
          try {
            const qrText = `${appUrl}/assets/${asset.id}`;
            qrMap[asset.id] = await QRCode.default.toDataURL(qrText, {
              width: 200,
              margin: 1,
              color: { dark: "#000000", light: "#ffffff" },
            });
          } catch {
            // ignore — label will print without QR
          }
        })
      );

      const printWin = window.open("", "_blank");
      if (!printWin) {
        toast.error("Please allow popups to launch bulk printing.");
        return;
      }

      const labelsHtml = selectedAssets
        .map(
          (asset) => `
          <div class="label">
            <div class="company">${companyName}</div>
            <div class="prop">Property of Company</div>
            <div class="name">${asset.asset_name}</div>
            <div class="tag">${asset.asset_tag}</div>
            ${asset.serial_number ? `<div class="sn">S/N: ${asset.serial_number}</div>` : ""}
            ${qrMap[asset.id] ? `<img class="qr" src="${qrMap[asset.id]}" />` : ""}
          </div>
        `
        )
        .join("");

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Batch Label Print (${selectedAssets.length} Assets)</title>
            <style>
              @page { size: 90mm 29mm; margin: 0; }
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
              .label {
                width: 90mm;
                height: 29mm;
                position: relative;
                box-sizing: border-box;
                border: 1px solid #000;
                padding: 2mm;
                background: #fff;
                page-break-after: always;
              }
              .company { position: absolute; left: 24mm; top: 3mm; font-size: 10pt; font-weight: bold; }
              .prop { position: absolute; left: 24mm; top: 7mm; font-size: 6.5pt; color: #444; }
              .name { position: absolute; left: 4mm; top: 13mm; font-size: 9pt; font-weight: bold; max-width: 60mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              .tag { position: absolute; left: 4mm; top: 19mm; font-size: 11pt; font-weight: bold; font-family: monospace; }
              .sn { position: absolute; left: 28mm; top: 21mm; font-size: 7.5pt; font-family: monospace; }
              .qr { position: absolute; right: 3mm; top: 3mm; width: 22mm; height: 22mm; }
            </style>
          </head>
          <body onload="window.print(); setTimeout(() => window.close(), 600);">
            ${labelsHtml}
          </body>
        </html>
      `);

      printWin.document.close();
      setOpen(false);
      toast.success(`Sent ${selectedAssets.length} asset labels to printer queue.`);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to execute bulk print");
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled || selectedAssets.length === 0} className="gap-1.5">
          <Printer className="h-4 w-4" />
          Print Selected Labels ({selectedAssets.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Batch Asset Label Printing Engine
          </DialogTitle>
          <DialogDescription>
            Generate and print tag labels for {selectedAssets.length} selected asset(s). Works with label, thermal, laser, and inkjet printers.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-60 overflow-y-auto rounded-md border p-3 space-y-2">
          {selectedAssets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between text-xs font-mono border-b pb-1.5 last:border-0">
              <span className="font-bold text-primary">{asset.asset_tag}</span>
              <span className="font-sans font-medium text-foreground">{asset.asset_name}</span>
              <span className="text-muted-foreground">{asset.serial_number || "No S/N"}</span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleExecuteBulkPrint} disabled={isPrinting}>
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Print Queue...
              </>
            ) : (
              `Print ${selectedAssets.length} Labels`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

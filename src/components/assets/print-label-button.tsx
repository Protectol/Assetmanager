"use client";

import { useState } from "react";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PrintLabelButtonProps {
  assetId: string;
  assetTag: string;
  assetName: string;
  serialNumber?: string;
  companyName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PrintLabelButton({
  assetId,
  assetTag,
  assetName,
  serialNumber,
  companyName = "Protectol Health",
  variant = "outline",
  size = "sm",
}: PrintLabelButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handlePrint() {
    setLoading(true);
    try {
      // Generate QR code client-side — no API call needed
      const QRCode = await import("qrcode");
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const qrText = `${appUrl}/scan/${assetId}`;
      const qrUrl = await QRCode.default.toDataURL(qrText, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });

      const printWin = window.open("", "_blank");
      if (!printWin) {
        toast.error("Please allow popups to print asset labels.");
        return;
      }

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Label - ${assetTag}</title>
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
              }
              .company { position: absolute; left: 24mm; top: 3mm; font-size: 10pt; font-weight: bold; }
              .prop { position: absolute; left: 24mm; top: 7mm; font-size: 6.5pt; color: #444; }
              .name { position: absolute; left: 4mm; top: 13mm; font-size: 9pt; font-weight: bold; max-width: 60mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              .tag { position: absolute; left: 4mm; top: 19mm; font-size: 11pt; font-weight: bold; font-family: monospace; }
              .sn { position: absolute; left: 28mm; top: 21mm; font-size: 7.5pt; font-family: monospace; }
              .qr { position: absolute; right: 3mm; top: 3mm; width: 22mm; height: 22mm; }
            </style>
          </head>
          <body onload="window.print(); setTimeout(() => window.close(), 500);">
            <div class="label">
              <div class="company">${companyName}</div>
              <div class="prop">Property of Company</div>
              <div class="name">${assetName}</div>
              <div class="tag">${assetTag}</div>
              ${serialNumber ? `<div class="sn">S/N: ${serialNumber}</div>` : ""}
              ${qrUrl ? `<img class="qr" src="${qrUrl}" />` : ""}
            </div>
          </body>
        </html>
      `);
      printWin.document.close();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to launch label print");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handlePrint} disabled={loading} className="gap-1.5">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
      Print Label
    </Button>
  );
}

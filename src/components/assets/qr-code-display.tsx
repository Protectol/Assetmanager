"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Download, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface QRCodeDisplayProps {
  assetId: string;
  assetTag: string;
  assetName: string;
}

export function QRCodeDisplay({ assetId, assetTag, assetName }: QRCodeDisplayProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compose QR content: asset URL so scanning opens asset detail page
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const qrText = `${appUrl}/scan/${assetId}`;

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    // Dynamically import qrcode to keep it out of the initial bundle
    import("qrcode")
      .then((QRCode) => {
        return QRCode.default.toDataURL(qrText, {
          width: 300,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
      })
      .then((url) => {
        setDataUrl(url);
      })
      .catch((err: unknown) => {
        console.error("QR generation failed:", err);
        toast.error("Failed to generate QR code");
      })
      .finally(() => setLoading(false));
  }, [open, qrText]);

  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `QR_${assetTag}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrint() {
    if (!dataUrl) return;
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>QR Code - ${assetTag}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
            img { width: 220px; height: 220px; }
            .tag { font-size: 20px; font-weight: bold; font-family: monospace; margin-top: 10px; }
            .name { font-size: 14px; color: #555; margin-top: 4px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <img src="${dataUrl}" alt="QR Code" />
          <div class="tag">${assetTag}</div>
          <div class="name">${assetName}</div>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <QrCode className="h-4 w-4" />
          View QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Asset QR Code
          </DialogTitle>
          <DialogDescription>
            Scan this code to instantly open the asset profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          {loading ? (
            <div className="flex h-48 w-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : dataUrl ? (
            <>
              <div className="rounded-xl border p-4 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dataUrl} alt={`QR Code for ${assetTag}`} className="h-48 w-48" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-lg font-bold tracking-wider">{assetTag}</div>
                <div className="text-xs text-muted-foreground">{assetName}</div>
                <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[260px] pt-1">
                  {qrText}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Unable to render QR code.</p>
          )}

          {/* Hidden canvas used as fallback ref */}
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2 w-full pt-2">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleDownload} disabled={!dataUrl}>
              <Download className="h-4 w-4" />
              Download PNG
            </Button>
            <Button className="flex-1 gap-1.5" onClick={handlePrint} disabled={!dataUrl}>
              <Printer className="h-4 w-4" />
              Print QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

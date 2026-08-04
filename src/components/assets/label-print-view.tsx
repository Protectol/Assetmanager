"use client";

import type { Asset, LabelTemplate } from "@/types";

interface LabelPrintViewProps {
  assets: Asset[];
  template?: LabelTemplate;
  qrDataUrls?: Record<string, string>;
  companyName?: string;
}

export function LabelPrintView({
  assets,
  template,
  qrDataUrls = {},
  companyName = "Protectol Health",
}: LabelPrintViewProps) {
  const widthMm = template?.width_mm || 90;
  const heightMm = template?.height_mm || 29;

  const style = template?.config.style || {
    border: true,
    borderColor: "#000000",
    backgroundColor: "#ffffff",
    padding: 2,
  };

  const elements = template?.config.elements || [
    { id: "logo", type: "logo", x: 4, y: 3, width: 16, height: 8, visible: true },
    { id: "company", type: "company_name", x: 22, y: 4, fontSize: 10, fontWeight: "bold", visible: true },
    { id: "asset_name", type: "asset_name", x: 4, y: 14, fontSize: 9, fontWeight: "bold", visible: true },
    { id: "asset_id", type: "asset_id", x: 4, y: 20, fontSize: 11, fontWeight: "bold", fontFamily: "monospace", visible: true },
    { id: "qr_code", type: "qr_code", x: 68, y: 3, width: 18, height: 18, visible: true },
    { id: "serial_number", type: "serial_number", x: 24, y: 20, fontSize: 7, fontFamily: "monospace", visible: true },
  ];

  return (
    <div className="print-container space-y-4">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="label-sticker relative overflow-hidden bg-white text-black border border-black page-break-after-always"
          style={{
            width: `${widthMm}mm`,
            height: `${heightMm}mm`,
            padding: `${style.padding || 2}mm`,
            boxSizing: "border-box",
          }}
        >
          {elements.map((el) => {
            if (!el.visible) return null;

            let content: React.ReactNode = el.content || "";
            if (el.type === "company_name") content = companyName;
            if (el.type === "asset_name") content = asset.asset_name;
            if (el.type === "asset_id") content = asset.asset_tag;
            if (el.type === "serial_number") content = asset.serial_number ? `S/N: ${asset.serial_number}` : "";
            if (el.type === "department") content = asset.current_holder?.department || "";
            if (el.type === "qr_code") {
              const qrUrl = qrDataUrls[asset.id];
              content = qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="QR" className="h-full w-full object-contain" />
              ) : (
                <div className="border border-black flex items-center justify-center text-[7px] h-full w-full">QR</div>
              );
            }

            return (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  left: `${el.x}mm`,
                  top: `${el.y}mm`,
                  width: el.width ? `${el.width}mm` : "auto",
                  height: el.height ? `${el.height}mm` : "auto",
                  fontSize: el.fontSize ? `${el.fontSize}pt` : "9pt",
                  fontWeight: el.fontWeight || "normal",
                  fontFamily: el.fontFamily || "sans-serif",
                  textAlign: el.alignment || "left",
                }}
              >
                {content}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

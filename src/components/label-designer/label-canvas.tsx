"use client";

import type { LabelTemplate } from "@/types";

interface LabelCanvasProps {
  template: LabelTemplate;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElementPosition: (id: string, x: number, y: number) => void;
  mockAsset?: {
    asset_name: string;
    asset_tag: string;
    serial_number?: string;
    brand?: string;
    company_name?: string;
  };
}

export function LabelCanvas({
  template,
  selectedElementId,
  onSelectElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdateElementPosition,
  mockAsset = {
    asset_name: 'MacBook Pro 16" M3',
    asset_tag: "IT-000001",
    serial_number: "C02XL0ABCDEF",
    brand: "Apple",
    company_name: "Protectol Health",
  },
}: LabelCanvasProps) {
  const mmToPxRatio = 3.78; // ~96 DPI ratio for mm to px
  const widthPx = template.width_mm * mmToPxRatio;
  const heightPx = template.height_mm * mmToPxRatio;

  const style = template.config.style || {
    border: true,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 2,
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-muted/40 rounded-xl border">
      <div className="text-xs text-muted-foreground mb-3 font-medium">
        Label Dimensions: {template.width_mm}mm × {template.height_mm}mm
      </div>

      <div
        className="relative shadow-lg transition-all select-none overflow-hidden"
        style={{
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          backgroundColor: style.backgroundColor || "#ffffff",
          border: style.border ? `1px dashed ${style.borderColor || "#cbd5e1"}` : "none",
          padding: `${(style.padding || 2) * mmToPxRatio}px`,
        }}
        onClick={() => onSelectElement(null)}
      >
        {(template.config.elements || []).map((el) => {
          if (!el.visible) return null;

          const isSelected = el.id === selectedElementId;
          const leftPx = el.x * mmToPxRatio;
          const topPx = el.y * mmToPxRatio;

          let content: React.ReactNode = el.content || "";
          if (el.type === "company_name") content = mockAsset.company_name || "Company Name";
          if (el.type === "asset_name") content = mockAsset.asset_name;
          if (el.type === "asset_id") content = mockAsset.asset_tag;
          if (el.type === "serial_number") content = `S/N: ${mockAsset.serial_number || "N/A"}`;
          if (el.type === "qr_code") {
            content = (
              <div className="bg-black text-white flex items-center justify-center font-bold text-[8px] h-full w-full rounded-sm">
                QR CODE
              </div>
            );
          }

          return (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(el.id);
              }}
              style={{
                position: "absolute",
                left: `${leftPx}px`,
                top: `${topPx}px`,
                width: el.width ? `${el.width * mmToPxRatio}px` : "auto",
                height: el.height ? `${el.height * mmToPxRatio}px` : "auto",
                fontSize: el.fontSize ? `${el.fontSize}px` : "12px",
                fontWeight: el.fontWeight || "normal",
                fontFamily: el.fontFamily || "sans-serif",
                textAlign: el.alignment || "left",
                cursor: "pointer",
              }}
              className={`transition-shadow p-0.5 ${
                isSelected
                  ? "ring-2 ring-primary ring-offset-1 z-10 bg-primary/10 rounded"
                  : "hover:ring-1 hover:ring-primary/50"
              }`}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

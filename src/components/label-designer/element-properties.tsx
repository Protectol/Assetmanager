"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LabelElement } from "@/types";

interface ElementPropertiesProps {
  element: LabelElement | null;
  onChange: (updated: LabelElement) => void;
}

export function ElementProperties({ element, onChange }: ElementPropertiesProps) {
  if (!element) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
        Click on an element in the canvas to customize its properties.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold capitalize">
          {element.type.replace("_", " ")} Properties
        </h4>
        <div className="flex items-center gap-2">
          <Label htmlFor="visible" className="text-xs">Visible</Label>
          <Switch
            id="visible"
            checked={element.visible}
            onCheckedChange={(val: boolean) => onChange({ ...element, visible: val })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">X Position (mm)</Label>
          <Input
            type="number"
            value={element.x}
            onChange={(e) => onChange({ ...element, x: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Y Position (mm)</Label>
          <Input
            type="number"
            value={element.y}
            onChange={(e) => onChange({ ...element, y: Number(e.target.value) })}
          />
        </div>

        {(element.type === "qr_code" || element.type === "logo") && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Width (mm)</Label>
              <Input
                type="number"
                value={element.width || 20}
                onChange={(e) => onChange({ ...element, width: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Height (mm)</Label>
              <Input
                type="number"
                value={element.height || 20}
                onChange={(e) => onChange({ ...element, height: Number(e.target.value) })}
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <Label className="text-xs">Font Size (pt)</Label>
          <Input
            type="number"
            value={element.fontSize || 10}
            onChange={(e) => onChange({ ...element, fontSize: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Font Weight</Label>
          <Select
            value={element.fontWeight || "normal"}
            onValueChange={(val) => onChange({ ...element, fontWeight: val as "normal" | "semibold" | "bold" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="semibold">Semibold</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Font Family</Label>
          <Select
            value={element.fontFamily || "sans-serif"}
            onValueChange={(val) => onChange({ ...element, fontFamily: val as "sans-serif" | "monospace" | "serif" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sans-serif">Sans-Serif (Inter)</SelectItem>
              <SelectItem value="monospace">Monospace (Code/Tag)</SelectItem>
              <SelectItem value="serif">Serif (Formal)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

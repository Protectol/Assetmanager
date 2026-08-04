"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Sliders, Layout } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LabelCanvas } from "@/components/label-designer/label-canvas";
import { ElementProperties } from "@/components/label-designer/element-properties";
import type { LabelTemplate, LabelElement } from "@/types";

interface LabelDesignerProps {
  initialTemplate?: LabelTemplate;
}

export function LabelDesigner({ initialTemplate }: LabelDesignerProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<LabelTemplate>(
    initialTemplate || {
      id: "",
      name: "Custom Asset Tag (90x29mm)",
      is_default: false,
      width_mm: 90,
      height_mm: 29,
      config: {
        elements: [
          { id: "logo", type: "logo", x: 5, y: 4, width: 20, height: 10, visible: true },
          { id: "company", type: "company_name", x: 28, y: 5, fontSize: 10, fontWeight: "bold", visible: true },
          { id: "asset_name", type: "asset_name", x: 5, y: 16, fontSize: 9, fontWeight: "bold", visible: true },
          { id: "asset_id", type: "asset_id", x: 5, y: 21, fontSize: 11, fontWeight: "bold", fontFamily: "monospace", visible: true },
          { id: "qr_code", type: "qr_code", x: 68, y: 4, width: 18, height: 18, visible: true },
          { id: "serial_number", type: "serial_number", x: 28, y: 21, fontSize: 7, fontFamily: "monospace", visible: true },
        ],
        style: {
          border: true,
          borderColor: "#cbd5e1",
          backgroundColor: "#ffffff",
          padding: 2,
        },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedElement =
    template.config.elements.find((el) => el.id === selectedElementId) || null;

  function handleUpdateElement(updated: LabelElement) {
    setTemplate((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        elements: prev.config.elements.map((el) => (el.id === updated.id ? updated : el)),
      },
    }));
  }

  function handleUpdateElementPosition(id: string, x: number, y: number) {
    setTemplate((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        elements: prev.config.elements.map((el) => (el.id === id ? { ...el, x, y } : el)),
      },
    }));
  }

  async function handleSaveTemplate() {
    setIsSaving(true);
    try {
      const isEdit = !!template.id;
      const url = isEdit ? `/api/label-templates/${template.id}` : "/api/label-templates";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save template");

      toast.success("Label template saved successfully!");
      router.push("/label-templates");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Could not save template");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Professional Asset Tag Designer</h2>
          <p className="text-muted-foreground">
            Configure precision dimensions, layout, typography, and QR code placement.
          </p>
        </div>
        <Button onClick={handleSaveTemplate} disabled={isSaving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving Template..." : "Save Label Template"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layout className="h-4 w-4" /> Live Visual Canvas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LabelCanvas
                template={template}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElementPosition={handleUpdateElementPosition}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4" /> Label Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Template Name</Label>
                <Input
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Width (mm)</Label>
                  <Input
                    type="number"
                    value={template.width_mm}
                    onChange={(e) =>
                      setTemplate({ ...template, width_mm: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Height (mm)</Label>
                  <Input
                    type="number"
                    value={template.height_mm}
                    onChange={(e) =>
                      setTemplate({ ...template, height_mm: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="is_default" className="text-xs">Set as Default Template</Label>
                <Switch
                  id="is_default"
                  checked={template.is_default}
                  onCheckedChange={(val: boolean) => setTemplate({ ...template, is_default: val })}
                />
              </div>
            </CardContent>
          </Card>

          <ElementProperties element={selectedElement} onChange={handleUpdateElement} />
        </div>
      </div>
    </div>
  );
}

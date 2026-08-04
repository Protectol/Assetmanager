"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AssetIdGeneratorProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

const PREFIX_OPTIONS = [
  { label: "IT Hardware (IT)", value: "IT" },
  { label: "Laptop (LAP)", value: "LAP" },
  { label: "Company IT (COMPANY-IT)", value: "COMPANY-IT" },
  { label: "Protech Laptop (PTH-LAP)", value: "PTH-LAP" },
  { label: "Desktop/Workstation (DT)", value: "DT" },
  { label: "Monitor (MON)", value: "MON" },
  { label: "Mobile / Tablet (MOB)", value: "MOB" },
];

export function AssetIdGenerator({ value, onChange, error }: AssetIdGeneratorProps) {
  const [selectedPrefix, setSelectedPrefix] = useState("IT");
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerateId() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/assets/generate-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: selectedPrefix, padding: 6, separator: "-" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate Asset ID");
      onChange(data.asset_id);
      toast.success(`Generated unique Asset ID: ${data.asset_id}`);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Could not auto-generate Asset ID");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="asset_tag">Asset Tag / Unique ID *</Label>
        <span className="text-xs text-muted-foreground">Permanent & Unique</span>
      </div>

      <div className="flex gap-2">
        <Select value={selectedPrefix} onValueChange={setSelectedPrefix}>
          <SelectTrigger className="w-[160px] shrink-0 font-mono text-xs">
            <SelectValue placeholder="Prefix" />
          </SelectTrigger>
          <SelectContent>
            {PREFIX_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          id="asset_tag"
          placeholder="e.g. IT-000001"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="font-mono uppercase font-bold"
        />

        <Button
          type="button"
          variant="outline"
          onClick={handleGenerateId}
          disabled={isGenerating}
          className="shrink-0 gap-1.5"
        >
          <Sparkles className={`h-4 w-4 text-amber-500 ${isGenerating ? "animate-spin" : ""}`} />
          Generate ID
        </Button>
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

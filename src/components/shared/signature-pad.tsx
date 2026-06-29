"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eraser } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (signature: string, type: "draw" | "type") => void;
  disabled?: boolean;
}

export function SignaturePad({ onSignatureChange, disabled }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [typedSignature, setTypedSignature] = useState("");
  const [activeTab, setActiveTab] = useState<"draw" | "type">("draw");

  const handleClear = () => {
    sigCanvas.current?.clear();
    onSignatureChange("", "draw");
  };

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      onSignatureChange(sigCanvas.current.toDataURL(), "draw");
    }
  };

  const handleTypedChange = (value: string) => {
    setTypedSignature(value);
    onSignatureChange(value, "type");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "draw" | "type");
    if (value === "draw") {
      onSignatureChange(sigCanvas.current?.isEmpty() ? "" : sigCanvas.current?.toDataURL() || "", "draw");
    } else {
      onSignatureChange(typedSignature, "type");
    }
  };

  return (
    <div className="space-y-3">
      <Label>Digital Signature</Label>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" disabled={disabled}>Draw Signature</TabsTrigger>
          <TabsTrigger value="type" disabled={disabled}>Type Signature</TabsTrigger>
        </TabsList>
        <TabsContent value="draw" className="space-y-2">
          <div className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: "w-full h-40 rounded-lg",
                style: { width: "100%", height: "160px" },
              }}
              onEnd={handleEnd}
              penColor="#1a1a2e"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
              onClick={handleClear}
              disabled={disabled}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Draw your signature in the box above</p>
        </TabsContent>
        <TabsContent value="type" className="space-y-2">
          <Input
            placeholder="Type your full name"
            value={typedSignature}
            onChange={(e) => handleTypedChange(e.target.value)}
            disabled={disabled}
            className="font-['Brush_Script_MT',cursive] text-2xl h-16"
            style={{ fontFamily: "'Brush Script MT', cursive" }}
          />
          <p className="text-xs text-muted-foreground">Type your full legal name as your signature</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

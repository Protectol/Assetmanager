"use client";

import { useRef, useState, useEffect } from "react";
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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Detect theme class on html element or prefers-color-scheme
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark") || 
                     window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(isDark ? "dark" : "light");
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

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
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold tracking-tight text-foreground">Digital Signature</Label>
        <p className="text-xs text-muted-foreground mt-0.5">Please sign below using your preferred method.</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-xl mb-4">
          <TabsTrigger value="draw" disabled={disabled} className="rounded-lg py-2">Draw Signature</TabsTrigger>
          <TabsTrigger value="type" disabled={disabled} className="rounded-lg py-2">Type Signature</TabsTrigger>
        </TabsList>
        
        <TabsContent value="draw" className="space-y-2 mt-0 focus-visible:outline-none">
          <div className="relative rounded-xl border border-border bg-white dark:bg-zinc-950 shadow-inner overflow-hidden">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: "w-full h-40 rounded-xl",
                style: { width: "100%", height: "160px" },
              }}
              onEnd={handleEnd}
              penColor={theme === "dark" ? "#f8fafc" : "#0f172a"}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-3 top-3 h-8 w-8 rounded-lg opacity-85 hover:opacity-100 shadow-sm border border-border bg-background"
              onClick={handleClear}
              disabled={disabled}
            >
              <Eraser className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">Draw your signature inside the box above</p>
        </TabsContent>

        <TabsContent value="type" className="space-y-2 mt-0 focus-visible:outline-none">
          <Input
            placeholder="Type your full name..."
            value={typedSignature}
            onChange={(e) => handleTypedChange(e.target.value)}
            disabled={disabled}
            className="font-['Brush_Script_MT',cursive] text-3xl text-center h-24 bg-white dark:bg-zinc-950 border border-border shadow-inner"
            style={{ fontFamily: "'Brush Script MT', cursive" }}
          />
          <p className="text-[11px] text-muted-foreground text-center">Type your full legal name as your signature</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

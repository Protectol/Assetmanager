"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsFormProps {
  initialSettings: {
    company_name: string;
    company_logo_url: string;
    form_link_expiry_days: string;
  };
  isAdmin: boolean;
}

export function SettingsForm({ initialSettings, isAdmin }: SettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error("Only admins can update settings");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save settings");
        return;
      }

      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="company_name">Company Name</Label>
        <Input
          id="company_name"
          value={settings.company_name}
          onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
          disabled={!isAdmin}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="company_logo_url">Company Logo URL</Label>
        <Input
          id="company_logo_url"
          value={settings.company_logo_url}
          onChange={(e) => setSettings({ ...settings, company_logo_url: e.target.value })}
          disabled={!isAdmin}
          placeholder="https://example.com/logo.png"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="form_link_expiry_days">Form Link Expiry (days)</Label>
        <Input
          id="form_link_expiry_days"
          type="number"
          min={1}
          max={90}
          value={settings.form_link_expiry_days}
          onChange={(e) => setSettings({ ...settings, form_link_expiry_days: e.target.value })}
          disabled={!isAdmin}
          className="mt-1"
        />
      </div>
      {isAdmin && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      )}
      {!isAdmin && (
        <p className="text-sm text-muted-foreground">Contact an admin to update settings.</p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// ----- Email Settings -----
interface EmailSettingsProps {
  initial: {
    email_default_to: string;
    email_default_cc: string;
    email_subject_template: string;
    email_body_template: string;
  };
  isAdmin: boolean;
}

export function EmailSettingsForm({ initial, isAdmin }: EmailSettingsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState(initial);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed to save");
        return;
      }
      toast.success("Email settings saved");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email_to">Default To</Label>
          <Input
            id="email_to"
            value={values.email_default_to}
            onChange={(e) => setValues({ ...values, email_default_to: e.target.value })}
            disabled={!isAdmin}
            placeholder="accounts@company.com"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email_cc">Default CC</Label>
          <Input
            id="email_cc"
            value={values.email_default_cc}
            onChange={(e) => setValues({ ...values, email_default_cc: e.target.value })}
            disabled={!isAdmin}
            placeholder="hr@company.com, it@company.com"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email_subject">Subject Template</Label>
        <Input
          id="email_subject"
          value={values.email_subject_template}
          onChange={(e) => setValues({ ...values, email_subject_template: e.target.value })}
          disabled={!isAdmin}
          placeholder="Asset Assignment Update - [Employee Name] - [Employee ID]"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Use: [Employee Name], [Employee ID], [Department]
        </p>
      </div>
      <div>
        <Label htmlFor="email_body">Email Body Template</Label>
        <Textarea
          id="email_body"
          value={values.email_body_template}
          onChange={(e) => setValues({ ...values, email_body_template: e.target.value })}
          disabled={!isAdmin}
          rows={12}
          className="mt-1 font-mono text-xs"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Use: [Employee Name], [Employee ID], [Department], [Designation], [Location], [Asset Table], [Admin Name], [Date]
        </p>
      </div>
      {isAdmin && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Email Settings
        </Button>
      )}
    </div>
  );
}

// ----- Asset Category Settings -----
interface CategorySettingsProps {
  initialCategories: string[];
  isAdmin: boolean;
}

export function CategorySettingsForm({ initialCategories, isAdmin }: CategorySettingsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [newCat, setNewCat] = useState("");

  const addCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories([...categories, trimmed]);
    setNewCat("");
  };

  const removeCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_categories: JSON.stringify(categories) }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed to save");
        return;
      }
      toast.success("Asset categories saved");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge key={cat} variant="secondary" className="gap-1.5 pr-1.5 text-sm">
            {cat}
            {isAdmin && (
              <button
                onClick={() => removeCategory(cat)}
                className="ml-1 rounded-full hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {isAdmin && (
        <>
          <div className="flex gap-2">
            <Input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              placeholder="New category name..."
              className="max-w-xs"
            />
            <Button variant="outline" onClick={addCategory}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Categories
          </Button>
        </>
      )}
    </div>
  );
}

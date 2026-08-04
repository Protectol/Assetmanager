"use client";

import { useState } from "react";
import { AlertTriangle, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ReportIssueDialogProps {
  assetId: string;
  assetTag: string;
  assetName: string;
}

export function ReportIssueDialog({ assetId, assetTag, assetName }: ReportIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState("Hardware Damage");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [description, setDescription] = useState("");
  const [markMaintenance, setMarkMaintenance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      toast.error("Please enter a description (at least 5 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/scan/${assetId}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_type: issueType,
          reporter_name: reporterName,
          reporter_email: reporterEmail,
          description,
          update_status: markMaintenance,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit issue report");

      setSubmitted(true);
      toast.success("Issue reported successfully!");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSubmitted(false);
    setDescription("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setSubmitted(false); }}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto gap-2 shadow-sm font-semibold">
          <AlertTriangle className="h-4 w-4" />
          Report an Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Report Asset Issue
          </DialogTitle>
          <DialogDescription>
            Report a hardware defect, damage, or missing item for asset <strong className="font-mono text-foreground">{assetTag}</strong> ({assetName}).
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-lg">Thank You!</h4>
              <p className="text-sm text-muted-foreground">
                Your report has been logged into the Protectol Health IT Asset Management system. The IT team will review it shortly.
              </p>
            </div>
            <Button onClick={handleReset} className="w-full">
              Close Window
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="issue_type">Issue Category</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger id="issue_type">
                  <SelectValue placeholder="Select Issue Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hardware Damage">Hardware Damage / Physical Defect</SelectItem>
                  <SelectItem value="Display / Screen Fault">Display / Screen Fault</SelectItem>
                  <SelectItem value="Accessories Missing">Accessories / Charger Missing</SelectItem>
                  <SelectItem value="Software / Boot Error">Software / OS Boot Error</SelectItem>
                  <SelectItem value="Needs Maintenance">Scheduled Maintenance Needed</SelectItem>
                  <SelectItem value="Lost or Stolen">Lost or Stolen</SelectItem>
                  <SelectItem value="Other Issue">Other Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reporter_name" className="text-xs">Your Name (Optional)</Label>
                <Input
                  id="reporter_name"
                  placeholder="John Doe"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reporter_email" className="text-xs">Your Email (Optional)</Label>
                <Input
                  id="reporter_email"
                  type="email"
                  placeholder="you@protectolhs.com"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of Issue *</Label>
              <Textarea
                id="description"
                placeholder="Describe what is wrong with this asset in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="mark_maintenance"
                checked={markMaintenance}
                onChange={(e) => setMarkMaintenance(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="mark_maintenance" className="text-xs text-muted-foreground cursor-pointer select-none">
                Flag asset status as <strong>Under Maintenance</strong>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={submitting} className="gap-1.5">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Issue Report
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

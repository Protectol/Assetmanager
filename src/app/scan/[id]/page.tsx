import { Building2, ShieldCheck, Tag, Info, PhoneCall } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReportIssueDialog } from "@/components/public/report-issue-dialog";
import type { Asset } from "@/types";

interface PublicScanPageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicScanPage({ params }: PublicScanPageProps) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: asset, error } = await supabase
    .from("assets")
    .select(`
      id, asset_name, asset_tag, asset_type, serial_number, brand, model,
      condition, status, purchase_date, warranty_expiry, notes,
      current_holder:employees!assets_current_holder_id_fkey(employee_name, department, location)
    `)
    .eq("id", id)
    .single();

  if (error || !asset) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md text-center shadow-lg border-muted">
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Info className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">Asset Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The scanned QR tag does not correspond to an active registered asset in Protectol Health system.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const typedAsset = asset as unknown as Asset;
  const holder = asset.current_holder as { employee_name?: string; department?: string; location?: string } | null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-5">
        {/* Header Branding */}
        <header className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight text-foreground">Protectol Health</h1>
              <p className="text-xs text-muted-foreground font-medium">Asset Verification System</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full px-2.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Official Asset Tag
          </div>
        </header>

        {/* Main Asset Info Card */}
        <Card className="shadow-lg border-muted overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span className="font-mono font-extrabold text-lg text-primary tracking-wide">
                  {typedAsset.asset_tag}
                </span>
              </div>
              <h2 className="font-bold text-xl text-foreground leading-tight">{typedAsset.asset_name}</h2>
              <p className="text-xs text-muted-foreground font-medium">{typedAsset.asset_type}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={typedAsset.status} />
              <StatusBadge status={typedAsset.condition} />
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Brand / Manufacturer</dt>
                <dd className="font-semibold text-foreground">{typedAsset.brand || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Model</dt>
                <dd className="font-semibold text-foreground">{typedAsset.model || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Serial Number</dt>
                <dd className="font-mono text-xs font-bold text-foreground">{typedAsset.serial_number || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Department / Location</dt>
                <dd className="font-semibold text-foreground">{holder?.department || holder?.location || "Central Inventory"}</dd>
              </div>
            </div>

            {/* Public Reporter Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                Experiencing a hardware malfunction or need maintenance?
              </div>
              <ReportIssueDialog
                assetId={typedAsset.id}
                assetTag={typedAsset.asset_tag}
                assetName={typedAsset.asset_name}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Footer Notice */}
        <footer className="text-center text-xs text-muted-foreground space-y-2 pt-2">
          <p className="flex items-center justify-center gap-1">
            <PhoneCall className="h-3.5 w-3.5 text-primary" />
            Property of Protectol Health. For assistance, contact IT Support.
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            © {new Date().getFullYear()} Protectol Health. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

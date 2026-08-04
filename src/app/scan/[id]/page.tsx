import { createClient } from "@supabase/supabase-js";
import { Building2, ShieldCheck, Tag, Info, PhoneCall, Cpu, Layers, Calendar, UserCheck } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReportIssueDialog } from "@/components/public/report-issue-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchAssetData(rawId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
  const fields = "id, asset_name, asset_tag, asset_type, serial_number, brand, model, condition, status, current_holder_id, has_sim, sim_number";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let asset: Record<string, any> | null = null;

  if (isUuid) {
    const { data } = await supabase.from("assets").select(fields).eq("id", rawId).maybeSingle();
    asset = data;
  }

  if (!asset) {
    const { data } = await supabase.from("assets").select(fields).ilike("asset_tag", rawId).maybeSingle();
    asset = data;
  }

  if (!asset) {
    const { data } = await supabase.from("assets").select(fields).ilike("asset_tag", `%${rawId}%`).limit(1).maybeSingle();
    asset = data;
  }

  if (!asset) return null;

  let holder = null;
  if (asset.current_holder_id) {
    const { data } = await supabase
      .from("employees")
      .select("employee_name, department, location")
      .eq("id", asset.current_holder_id)
      .maybeSingle();
    holder = data;
  }

  return { asset, holder };
}

export default async function PublicScanPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();
  const result = await fetchAssetData(decodedId);

  const Header = () => (
    <header className="flex items-center justify-center gap-3 border-b pb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="text-left">
        <h1 className="font-bold text-base leading-tight text-foreground">Protectol Health</h1>
        <p className="text-xs text-muted-foreground font-medium">Asset Verification System</p>
      </div>
    </header>
  );

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <Header />
          <Card className="shadow-lg border-muted text-center p-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Info className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight">Asset Tag Unverified</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The scanned identifier{" "}
                <span className="font-mono font-semibold text-foreground">{decodedId}</span>{" "}
                does not match an active record in the system.
              </p>
            </div>
            <div className="pt-2 text-xs text-muted-foreground border-t">
              If this is an official company asset, please contact IT Asset Management.
            </div>
          </Card>
          <footer className="text-center text-xs text-muted-foreground pt-2">
            <p>© {new Date().getFullYear()} Protectol Health. All rights reserved.</p>
          </footer>
        </div>
      </div>
    );
  }

  const { asset, holder } = result;

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
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Verified Tag
          </div>
        </header>

        {/* Main Asset Details Card */}
        <Card className="shadow-xl border-muted overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span className="font-mono font-extrabold text-lg text-primary tracking-wider">
                  {asset.asset_tag}
                </span>
              </div>
              <h2 className="font-bold text-xl text-foreground leading-tight">{asset.asset_name}</h2>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{asset.asset_type}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={asset.status} />
              <StatusBadge status={asset.condition} />
            </div>
          </div>

          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5" />
                  Brand / Model
                </dt>
                <dd className="font-semibold text-foreground">
                  {asset.brand || asset.model
                    ? `${asset.brand || ""} ${asset.model || ""}`.trim()
                    : "—"}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  Serial Number
                </dt>
                <dd className="font-mono text-xs font-bold text-foreground">
                  {asset.serial_number || "—"}
                </dd>
              </div>

              {asset.has_sim && (
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <PhoneCall className="h-3.5 w-3.5" />
                    SIM Number
                  </dt>
                  <dd className="font-mono text-xs font-bold text-foreground">
                    {asset.sim_number || "No number assigned"}
                  </dd>
                </div>
              )}

              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5" />
                  Department
                </dt>
                <dd className="font-semibold text-foreground">
                  {holder?.department || holder?.location || "Central Inventory"}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Current Status
                </dt>
                <dd className="font-semibold text-foreground capitalize">
                  {asset.status}
                </dd>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                Found a defect or need IT maintenance for this asset?
              </div>
              <ReportIssueDialog
                assetId={asset.id}
                assetTag={asset.asset_tag}
                assetName={asset.asset_name}
              />
            </div>
          </CardContent>
        </Card>

        <footer className="text-center text-xs text-muted-foreground space-y-2 pt-2">
          <p className="flex items-center justify-center gap-1">
            <PhoneCall className="h-3.5 w-3.5 text-primary" />
            Official Property of Protectol Health.
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            © {new Date().getFullYear()} Protectol Health. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

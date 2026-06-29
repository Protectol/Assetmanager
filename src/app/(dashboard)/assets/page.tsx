import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canManageAssets } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetTable } from "@/components/assets/asset-table";
import type { Asset } from "@/types";

export default async function AssetsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: assets } = await supabase
    .from("assets")
    .select(`
      *,
      current_holder:employees!assets_current_holder_id_fkey(id, employee_name, employee_id)
    `)
    .order("created_at", { ascending: false });

  const canManage = user ? canManageAssets(user.role) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assets</h2>
          <p className="text-muted-foreground">Manage company hardware and equipment</p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/assets/new">
              <Plus className="h-4 w-4" />
              Add Asset
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetTable assets={(assets as Asset[]) || []} />
        </CardContent>
      </Card>
    </div>
  );
}

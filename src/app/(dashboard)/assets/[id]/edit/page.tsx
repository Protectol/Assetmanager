import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AssetForm } from "@/components/assets/asset-form";
import type { Asset } from "@/types";

interface EditAssetPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  await requireRole(["admin", "it"]);

  const { id } = await params;
  const supabase = await createClient();

  const { data: asset } = await supabase.from("assets").select("*").eq("id", id).single();

  if (!asset) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={`/assets/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Asset
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Edit Asset</h2>
        <p className="text-muted-foreground">Update details for {asset.asset_name}</p>
      </div>

      <AssetForm mode="edit" asset={asset as Asset} />
    </div>
  );
}

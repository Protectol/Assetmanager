import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AssetForm } from "@/components/assets/asset-form";

export default async function NewAssetPage() {
  await requireRole(["admin", "it"]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/assets">
            <ArrowLeft className="h-4 w-4" />
            Back to Assets
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Add Asset</h2>
        <p className="text-muted-foreground">Register a new asset in the inventory</p>
      </div>

      <AssetForm mode="create" />
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { createAsset, updateAsset } from "@/lib/actions/assets";
import type { Asset } from "@/types";

const assetSchema = z.object({
  asset_name: z.string().min(1, "Asset name is required"),
  asset_type: z.string().min(1, "Asset type is required"),
  asset_tag: z.string().min(1, "Asset tag is required"),
  serial_number: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_expiry: z.string().optional(),
  condition: z.enum(["new", "good", "damaged", "lost"]),
  status: z.enum(["available", "assigned", "repair", "lost", "returned"]),
  remarks: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetFormProps {
  asset?: Asset;
  mode: "create" | "edit";
}

export function AssetForm({ asset, mode }: AssetFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      asset_name: asset?.asset_name ?? "",
      asset_type: asset?.asset_type ?? "",
      asset_tag: asset?.asset_tag ?? "",
      serial_number: asset?.serial_number ?? "",
      brand: asset?.brand ?? "",
      model: asset?.model ?? "",
      purchase_date: asset?.purchase_date ?? "",
      warranty_expiry: asset?.warranty_expiry ?? "",
      condition: asset?.condition ?? "new",
      status: asset?.status ?? "available",
      remarks: asset?.remarks ?? "",
    },
  });

  const condition = watch("condition");
  const status = watch("status");

  function onSubmit(values: AssetFormValues) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createAsset(values);
        } else if (asset) {
          await updateAsset(asset.id, values);
        }
      } catch (error) {
        if (isRedirectError(error)) throw error;
        toast.error(error instanceof Error ? error.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="asset_name">Asset Name *</Label>
              <Input id="asset_name" {...register("asset_name")} placeholder="MacBook Pro 14" />
              {errors.asset_name && (
                <p className="text-sm text-destructive">{errors.asset_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset_type">Asset Type *</Label>
              <Input id="asset_type" {...register("asset_type")} placeholder="Laptop" />
              {errors.asset_type && (
                <p className="text-sm text-destructive">{errors.asset_type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset_tag">Asset Tag *</Label>
              <Input id="asset_tag" {...register("asset_tag")} placeholder="IT-LAP-001" />
              {errors.asset_tag && (
                <p className="text-sm text-destructive">{errors.asset_tag.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input id="serial_number" {...register("serial_number")} placeholder="C02XYZ..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...register("brand")} placeholder="Apple" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" {...register("model")} placeholder="MacBook Pro M3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input id="purchase_date" type="date" {...register("purchase_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
              <Input id="warranty_expiry" type="date" {...register("warranty_expiry")} />
            </div>
            <div className="space-y-2">
              <Label>Condition *</Label>
              <Select value={condition} onValueChange={(v) => setValue("condition", v as AssetFormValues["condition"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              {errors.condition && (
                <p className="text-sm text-destructive">{errors.condition.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as AssetFormValues["status"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              {...register("remarks")}
              placeholder="Additional notes about this asset..."
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <LoadingSpinner size="sm" />}
            {mode === "create" ? "Create Asset" : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

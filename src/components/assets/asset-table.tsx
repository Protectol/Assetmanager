"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/loading";
import { BulkPrintDialog } from "@/components/assets/bulk-print-dialog";
import { PrintLabelButton } from "@/components/assets/print-label-button";
import type { Asset, AssetCondition, AssetStatus } from "@/types";

interface AssetTableProps {
  assets: Asset[];
  companyName?: string;
}

export function AssetTable({ assets, companyName }: AssetTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [conditionFilter, setConditionFilter] = useState<AssetCondition | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredAssets = useMemo(() => {
    const query = search.toLowerCase().trim();

    return assets.filter((asset) => {
      const matchesSearch =
        !query ||
        asset.asset_name.toLowerCase().includes(query) ||
        asset.asset_tag.toLowerCase().includes(query) ||
        (asset.serial_number?.toLowerCase().includes(query) ?? false) ||
        (asset.current_holder?.employee_name.toLowerCase().includes(query) ?? false);

      const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
      const matchesCondition = conditionFilter === "all" || asset.condition === conditionFilter;

      return matchesSearch && matchesStatus && matchesCondition;
    });
  }, [assets, search, statusFilter, conditionFilter]);

  const selectedAssets = useMemo(
    () => filteredAssets.filter((a) => selectedIds.has(a.id)),
    [filteredAssets, selectedIds]
  );

  function toggleSelectAll() {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
    }
  }

  function toggleSelectRow(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, tag, serial, or employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BulkPrintDialog selectedAssets={selectedAssets} companyName={companyName} />

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AssetStatus | "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={conditionFilter}
            onValueChange={(v) => setConditionFilter(v as AssetCondition | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <EmptyState
          title="No assets found"
          description={
            search || statusFilter !== "all" || conditionFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Add your first asset to get started"
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredAssets.length > 0 && selectedIds.size === filteredAssets.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Tag / Unique ID</TableHead>
              <TableHead>Asset Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Current Holder</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.map((asset) => {
              const isSelected = selectedIds.has(asset.id);
              return (
                <TableRow key={asset.id} className={isSelected ? "bg-muted/40" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectRow(asset.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono font-bold text-sm text-primary">
                    <Link href={`/assets/${asset.id}`} className="hover:underline">
                      {asset.asset_tag}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/assets/${asset.id}`} className="hover:underline">
                      {asset.asset_name}
                    </Link>
                  </TableCell>
                  <TableCell>{asset.asset_type}</TableCell>
                  <TableCell className="font-mono text-xs">{asset.serial_number || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={asset.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={asset.condition} />
                  </TableCell>
                  <TableCell>
                    {asset.current_holder ? (
                      <Link
                        href={`/employees/${asset.current_holder.id}`}
                        className="text-primary hover:underline"
                      >
                        {asset.current_holder.employee_name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <PrintLabelButton
                      assetId={asset.id}
                      assetTag={asset.asset_tag}
                      assetName={asset.asset_name}
                      serialNumber={asset.serial_number}
                      companyName={companyName}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

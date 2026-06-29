"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import type { Asset, AssetCondition, AssetStatus } from "@/types";

interface AssetTableProps {
  assets: Asset[];
}

export function AssetTable({ assets }: AssetTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [conditionFilter, setConditionFilter] = useState<AssetCondition | "all">("all");

  const filteredAssets = useMemo(() => {
    const query = search.toLowerCase().trim();

    return assets.filter((asset) => {
      const matchesSearch =
        !query ||
        asset.asset_name.toLowerCase().includes(query) ||
        asset.asset_tag.toLowerCase().includes(query) ||
        (asset.serial_number?.toLowerCase().includes(query) ?? false);

      const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
      const matchesCondition = conditionFilter === "all" || asset.condition === conditionFilter;

      return matchesSearch && matchesStatus && matchesCondition;
    });
  }, [assets, search, statusFilter, conditionFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, tag, or serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AssetStatus | "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
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
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Current Holder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>
                  <Link href={`/assets/${asset.id}`} className="font-medium text-primary hover:underline">
                    {asset.asset_name}
                  </Link>
                </TableCell>
                <TableCell>{asset.asset_type}</TableCell>
                <TableCell className="font-mono text-sm">{asset.asset_tag}</TableCell>
                <TableCell className="font-mono text-sm">{asset.serial_number || "—"}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

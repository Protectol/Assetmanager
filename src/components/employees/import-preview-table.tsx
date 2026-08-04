"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ImportPreviewRow } from "@/types";

interface ImportPreviewTableProps {
  rows: ImportPreviewRow[];
}

export function ImportPreviewTable({ rows }: ImportPreviewTableProps) {
  return (
    <div className="max-h-[400px] overflow-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="w-12">Row</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Notes / Errors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => {
            const badgeVariant =
              row.action_type === "new"
                ? "default"
                : row.action_type === "update"
                ? "secondary"
                : row.action_type === "duplicate"
                ? "outline"
                : "destructive";

            const rowBg =
              row.action_type === "new"
                ? "bg-emerald-500/5 dark:bg-emerald-500/10"
                : row.action_type === "update"
                ? "bg-blue-500/5 dark:bg-blue-500/10"
                : row.action_type === "duplicate"
                ? "bg-amber-500/5 dark:bg-amber-500/10"
                : "bg-red-500/10 dark:bg-red-500/20";

            return (
              <TableRow key={idx} className={rowBg}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {row.row_index}
                </TableCell>
                <TableCell>
                  <Badge variant={badgeVariant} className="capitalize">
                    {row.action_type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold">
                  {row.employee_id || "— (Auto)"}
                </TableCell>
                <TableCell className="font-medium">{row.employee_name}</TableCell>
                <TableCell className="text-xs">{row.email}</TableCell>
                <TableCell className="text-xs">{row.department}</TableCell>
                <TableCell className="text-xs">{row.designation}</TableCell>
                <TableCell className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {row.validation_error || (row.action_type === "update" ? "Existing record will be updated" : "Will create new record")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

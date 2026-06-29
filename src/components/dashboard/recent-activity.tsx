import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, capitalize } from "@/lib/utils";
import type { AssetHistory } from "@/types";
import { EmptyState } from "@/components/ui/loading";

interface RecentActivityProps {
  history: AssetHistory[];
}

export function RecentActivity({ history }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Asset Movements</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <EmptyState title="No recent activity" description="Asset movements will appear here" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{formatDateTime(item.date)}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.action} />
                  </TableCell>
                  <TableCell>
                    {item.asset ? (
                      <Link href={`/assets/${item.asset_id}`} className="text-primary hover:underline">
                        {item.asset.asset_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {item.employee ? (
                      <Link href={`/employees/${item.employee_id}`} className="text-primary hover:underline">
                        {item.employee.employee_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.performer?.full_name || "System"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

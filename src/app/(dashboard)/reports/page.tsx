"use client";

import { Download, FileText, History, ClipboardCheck, Clock, PackageMinus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const reports = [
  {
    type: "employee-assets",
    title: "Employee Asset Register",
    description: "Current asset assignments per employee",
    icon: FileText,
  },
  {
    type: "asset-history",
    title: "Asset History",
    description: "Complete audit trail of all asset actions",
    icon: History,
  },
  {
    type: "verification",
    title: "Verification Corrections",
    description: "Employee-reported verification discrepancies",
    icon: ClipboardCheck,
  },
  {
    type: "pending-forms",
    title: "Pending Forms",
    description: "Outstanding employee forms awaiting submission",
    icon: Clock,
  },
  {
    type: "returns",
    title: "Asset Returns",
    description: "History of all asset return transactions",
    icon: PackageMinus,
  },
];

export default function ReportsPage() {
  const downloadReport = (type: string) => {
    window.open(`/api/reports/${type}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">Download PDF reports for asset management</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.type} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <report.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription className="mt-1">{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => downloadReport(report.type)}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

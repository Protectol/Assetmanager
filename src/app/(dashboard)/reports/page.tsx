import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, Clock, Users, Laptop, XCircle,
  AlertCircle, FileSpreadsheet, FileText, Database, History,
  BarChart3, Download,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface EmpInfo { id: string; employee_name: string; employee_id: string; department: string; designation?: string; }
interface DeclaredAsset { category: string; has_asset: boolean; condition: string; fields: Record<string, string>; remarks: string; }
interface CvForm {
  id: string;
  status: string;
  created_at: string;
  expires_at: string;
  employee: EmpInfo;
  submission: { submitted_at?: string; submission_data?: { declared_assets?: DeclaredAsset[] } } | null;
}

function getSub(f: unknown): CvForm["submission"] { return (f as CvForm).submission; }
function getDeclared(f: unknown): DeclaredAsset[] { return getSub(f)?.submission_data?.declared_assets || []; }

const REPORTS = [
  {
    key: "employee-assets",
    title: "All Assigned Assets",
    description: "Full register of all active assets currently assigned to team members — includes name, department, asset type, serial number, and condition.",
    icon: Database,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900/50",
    badge: "Total Assets",
  },
  {
    key: "laptops",
    title: "Laptops Only",
    description: "Filtered report showing only laptop devices assigned to team members — useful for IT audits and hardware tracking.",
    icon: Laptop,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-900/50",
    badge: "Laptops",
  },
  {
    key: "laptops-chargers",
    title: "Laptops & Chargers",
    description: "Combined report of all laptops and chargers/adapters assigned. Helps identify team members who have one but not the other.",
    icon: BarChart3,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900/50",
    badge: "Laptops & Chargers",
  },
  {
    key: "asset-history",
    title: "Asset History Log",
    description: "Complete log of all asset movements — assignments, returns, exchanges, and transfers with dates and details.",
    icon: History,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900/50",
    badge: "History",
  },
  {
    key: "verification",
    title: "Verification Campaign",
    description: "Status report of the current asset verification campaign — shows all corrections, approvals, and pending items.",
    icon: CheckCircle2,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-900/50",
    badge: "Verification",
  },
];

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: rawEmployees } = await supabase
    .from("employees")
    .select("id, employee_name, employee_id, department, designation")
    .eq("status", "active");

  const { data: rawForms } = await supabase
    .from("forms")
    .select(`
      id, status, created_at, expires_at,
      employee:employees(id, employee_name, employee_id, department),
      submission:form_submissions(submitted_at, submission_data)
    `)
    .eq("action_type", "current_verification")
    .order("created_at", { ascending: false });

  const employees = (rawEmployees || []) as EmpInfo[];
  const cvForms = (rawForms || []) as unknown as CvForm[];

  const allEmployeeIds = new Set(employees.map((e) => e.id));
  const submittedEmployeeIds = new Set(
    cvForms
      .filter((f) => f.status === "completed" || f.status === "approved")
      .map((f) => f.employee.id)
  );

  const notSubmitted = employees.filter((e) => !submittedEmployeeIds.has(e.id));
  const pendingForms = cvForms.filter((f) => f.status === "pending");
  const completedForms = cvForms.filter((f) => f.status === "completed");
  const approvedForms = cvForms.filter((f) => f.status === "approved");

  const laptopNoCharger: CvForm[] = [];
  const damagedAssets: CvForm[] = [];
  const missingSerials: CvForm[] = [];

  for (const form of cvForms) {
    const declared = getDeclared(form);
    const hasLaptop = declared.some((a) => a.category === "Laptop" && a.has_asset);
    const hasCharger = declared.some((a) => a.category === "Laptop Charger" && a.has_asset);
    if (hasLaptop && !hasCharger) laptopNoCharger.push(form);
    if (declared.some((a) => a.has_asset && a.condition === "damaged")) damagedAssets.push(form);
    if (declared.some((a) => a.has_asset && !["SIM Card", "Access Card"].includes(a.category) && !a.fields?.serial_number && !a.fields?.imei))
      missingSerials.push(form);
  }

  const verificationStats = [
    { label: "Pending Submission", value: pendingForms.length, icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
    { label: "Awaiting Review", value: completedForms.length, icon: AlertCircle, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
    { label: "Approved", value: approvedForms.length, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Not Submitted", value: notSubmitted.length, icon: Users, color: "text-gray-500 bg-gray-100 dark:bg-gray-800" },
    { label: "Laptop No Charger", value: laptopNoCharger.length, icon: Laptop, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/30" },
    { label: "Damaged Assets", value: damagedAssets.length, icon: AlertTriangle, color: "text-red-500 bg-red-50 dark:bg-red-950/30" },
    { label: "Missing Serials", value: missingSerials.length, icon: XCircle, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30" },
    { label: "Total Team Members", value: allEmployeeIds.size, icon: Users, color: "text-slate-500 bg-slate-100 dark:bg-slate-800" },
  ];

  const FormTable = ({ forms, showSubmitted = false }: { forms: CvForm[]; showSubmitted?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team Member</TableHead>
          {showSubmitted && <TableHead>Submitted</TableHead>}
          {!showSubmitted && <TableHead>Created</TableHead>}
          {!showSubmitted && <TableHead>Expires</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {forms.map((f) => (
          <TableRow key={f.id}>
            <TableCell>
              <p className="font-medium">{f.employee.employee_name}</p>
              <p className="text-xs text-muted-foreground">{f.employee.employee_id}</p>
            </TableCell>
            {showSubmitted && (
              <TableCell className="text-sm">{f.submission?.submitted_at ? formatDateTime(f.submission.submitted_at) : "—"}</TableCell>
            )}
            {!showSubmitted && <TableCell className="text-sm">{formatDateTime(f.created_at)}</TableCell>}
            {!showSubmitted && <TableCell className="text-sm">{formatDateTime(f.expires_at)}</TableCell>}
            <TableCell><StatusBadge status={f.status} /></TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" asChild><Link href={`/forms/${f.id}`}>View</Link></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const EmployeeDeptTable = ({ forms }: { forms: CvForm[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team Member</TableHead>
          <TableHead>Department</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {forms.map((f) => (
          <TableRow key={f.id}>
            <TableCell>
              <p className="font-medium">{f.employee.employee_name}</p>
              <p className="text-xs text-muted-foreground">{f.employee.employee_id}</p>
            </TableCell>
            <TableCell>{f.employee.department}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" asChild><Link href={`/forms/${f.id}`}>View</Link></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground mt-1">Download asset registers and track verification compliance</p>
      </div>

      {/* ── Section 1: Download Reports ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Download Reports</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.key} className={`border ${report.border} transition-shadow hover:shadow-md`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`p-2.5 rounded-xl ${report.bg} shrink-0`}>
                      <Icon className={`h-5 w-5 ${report.color}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">{report.badge}</Badge>
                  </div>
                  <CardTitle className="text-base mt-3">{report.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={`/api/reports/${report.key}`} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" /> PDF
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={`/api/reports/${report.key}?format=excel`} target="_blank" rel="noopener noreferrer">
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Verification Campaign Overview ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Verification Campaign Overview</h3>
        </div>

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-6">
          {verificationStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Not Submitted */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-muted-foreground" />
              Not Yet Submitted ({notSubmitted.length})
            </CardTitle>
            <CardDescription>Active team members with no verification submission</CardDescription>
          </CardHeader>
          <CardContent>
            {notSubmitted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All team members have submitted ✓</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notSubmitted.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.employee_name}</TableCell>
                      <TableCell className="text-muted-foreground">{emp.employee_id}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{emp.designation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Verification Links ({pendingForms.length})
            </CardTitle>
            <CardDescription>Links generated but not yet submitted</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingForms.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">No pending forms</p>
              : <FormTable forms={pendingForms} />}
          </CardContent>
        </Card>

        {/* Awaiting Review */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Awaiting Admin Review ({completedForms.length})
            </CardTitle>
            <CardDescription>Forms submitted but not yet approved or rejected</CardDescription>
          </CardHeader>
          <CardContent>
            {completedForms.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">No forms pending review</p>
              : <FormTable forms={completedForms} showSubmitted />}
          </CardContent>
        </Card>

        {laptopNoCharger.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-900/40 mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-orange-600 dark:text-orange-400">
                <Laptop className="h-5 w-5" />
                Laptop Without Charger ({laptopNoCharger.length})
              </CardTitle>
              <CardDescription>Team members who declared a laptop but no charger — requires follow-up</CardDescription>
            </CardHeader>
            <CardContent><EmployeeDeptTable forms={laptopNoCharger} /></CardContent>
          </Card>
        )}

        {damagedAssets.length > 0 && (
          <Card className="border-red-200 dark:border-red-900/40 mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Team Members with Damaged Assets ({damagedAssets.length})
              </CardTitle>
              <CardDescription>One or more assets reported as damaged</CardDescription>
            </CardHeader>
            <CardContent><EmployeeDeptTable forms={damagedAssets} /></CardContent>
          </Card>
        )}

        {missingSerials.length > 0 && (
          <Card className="border-purple-200 dark:border-purple-900/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-purple-600 dark:text-purple-400">
                <XCircle className="h-5 w-5" />
                Assets Missing Serial Numbers ({missingSerials.length})
              </CardTitle>
              <CardDescription>Forms where trackable assets were submitted without a serial number</CardDescription>
            </CardHeader>
            <CardContent><EmployeeDeptTable forms={missingSerials} /></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

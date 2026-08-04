import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canImportEmployees } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeTable } from "@/components/employees/employee-table";
import { EmployeeImportDialog } from "@/components/employees/import-dialog";
import type { Employee } from "@/types";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .order("employee_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const employeeList = (employees || []) as Employee[];
  const departments = [...new Set(employeeList.map((e) => e.department))].sort();
  const canImport = user ? canImportEmployees(user.role) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Members</h2>
          <p className="text-muted-foreground">
            Manage employee records, bulk imports, and asset assignments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canImport && (
            <>
              <Button variant="outline" asChild className="gap-1.5">
                <a href="/api/employees/export" target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Export Excel
                </a>
              </Button>
              <EmployeeImportDialog />
            </>
          )}

          <Button asChild className="gap-1.5">
            <Link href="/employees/new">
              <Plus className="h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees ({employeeList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeTable employees={employeeList} departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}

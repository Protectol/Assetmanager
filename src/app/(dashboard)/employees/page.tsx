import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeTable } from "@/components/employees/employee-table";
import type { Employee } from "@/types";

export default async function EmployeesPage() {
  const supabase = await createClient();

  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .order("employee_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const employeeList = (employees || []) as Employee[];
  const departments = [...new Set(employeeList.map((e) => e.department))].sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Members</h2>
          <p className="text-muted-foreground">
            Manage employee records and asset assignments
          </p>
        </div>
        <Button asChild>
          <Link href="/employees/new">
            <Plus className="h-4 w-4" />
            Add Employee
          </Link>
        </Button>
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

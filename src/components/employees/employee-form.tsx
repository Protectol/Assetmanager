"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import type { Employee, EmployeeStatus } from "@/types";

const employeeStatuses: EmployeeStatus[] = ["active", "inactive", "resigned", "on_leave"];

const employeeSchema = z.object({
  employee_name: z.string().min(1, "Team Member name is required"),
  employee_id: z.string().min(1, "Team Member ID is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  location: z.string().min(1, "Location is required"),
  manager: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone_number: z.string().optional(),
  status: z.enum(["active", "inactive", "resigned", "on_leave"]),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: Employee;
  mode: "create" | "edit";
}

export function EmployeeForm({ employee, mode }: EmployeeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_name: employee?.employee_name ?? "",
      employee_id: employee?.employee_id ?? "",
      department: employee?.department ?? "",
      designation: employee?.designation ?? "",
      location: employee?.location ?? "",
      manager: employee?.manager ?? "",
      email: employee?.email ?? "",
      phone_number: employee?.phone_number ?? "",
      status: employee?.status ?? "active",
    },
  });

  const status = watch("status");

  async function onSubmit(values: EmployeeFormValues) {
    setIsSubmitting(true);
    const supabase = createClient();

    const payload = {
      employee_name: values.employee_name.trim(),
      employee_id: values.employee_id.trim(),
      department: values.department.trim(),
      designation: values.designation.trim(),
      location: values.location.trim(),
      manager: values.manager?.trim() || null,
      email: values.email.trim(),
      phone_number: values.phone_number?.trim() || null,
      status: values.status,
    };

    try {
      if (mode === "create") {
        const { data, error } = await supabase
          .from("employees")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;

        toast.success("Team Member created successfully");
        router.push(`/employees/${data.id}`);
        router.refresh();
      } else if (employee) {
        const { error } = await supabase
          .from("employees")
          .update(payload)
          .eq("id", employee.id);

        if (error) throw error;

        toast.success("Team Member updated successfully");
        router.push(`/employees/${employee.id}`);
        router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(mode === "create" ? "Failed to create employee" : "Failed to update employee", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="grid gap-6 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="employee_name">Team Member Name</Label>
            <Input id="employee_name" {...register("employee_name")} />
            {errors.employee_name && (
              <p className="text-sm text-destructive">{errors.employee_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_id">Team Member ID</Label>
            <Input id="employee_id" {...register("employee_id")} />
            {errors.employee_id && (
              <p className="text-sm text-destructive">{errors.employee_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" {...register("department")} />
            {errors.department && (
              <p className="text-sm text-destructive">{errors.department.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" {...register("designation")} />
            {errors.designation && (
              <p className="text-sm text-destructive">{errors.designation.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <Input id="manager" {...register("manager")} placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input id="phone_number" {...register("phone_number")} placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setValue("status", value as EmployeeStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {employeeStatuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoadingSpinner size="sm" />}
            {mode === "create" ? "Create Team Member" : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

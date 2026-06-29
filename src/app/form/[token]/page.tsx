import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/admin";
import { EmployeeFormView } from "@/components/forms/employee-form-view";
import type { FormActionType } from "@/types";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: form, error } = await supabase
    .from("forms")
    .select(`
      id, token, action_type, status, expires_at, notes,
      employee:employees(employee_name, employee_id, department, designation, location, email),
      form_assets(
        id, asset_id, old_asset_id, condition, remarks, verified,
        asset:assets(id, asset_name, asset_type, asset_tag, serial_number, brand, model, condition),
        old_asset:assets!form_assets_old_asset_id_fkey(id, asset_name, asset_tag, serial_number)
      )
    `)
    .eq("token", token)
    .single();

  if (error || !form) notFound();

  if (form.status === "pending" && new Date(form.expires_at) < new Date()) {
    await supabase.from("forms").update({ status: "expired" }).eq("id", form.id);
    form.status = "expired";
  }

  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["company_name", "company_logo_url"]);

  const settingsMap = Object.fromEntries((settings || []).map((s) => [s.key, s.value]));

  return (
    <EmployeeFormView
      form={{
        ...form,
        action_type: form.action_type as FormActionType,
        employee: form.employee as unknown as {
          employee_name: string;
          employee_id: string;
          department: string;
          designation: string;
          location: string;
          email: string;
        },
        form_assets: form.form_assets as unknown as Parameters<typeof EmployeeFormView>[0]["form"]["form_assets"],
        companyName: settingsMap.company_name || process.env.NEXT_PUBLIC_COMPANY_NAME,
        companyLogoUrl: settingsMap.company_logo_url || "",
      }}
      readOnly={form.status === "completed"}
    />
  );
}

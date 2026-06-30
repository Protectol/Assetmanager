import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { FormDetailClient } from "@/components/forms/form-detail-client";
import type { Form, FormAsset, FormSubmission, Employee, Asset } from "@/types";

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, supabase] = await Promise.all([requireAuth(), createClient()]);

  const { data: form, error } = await supabase
    .from("forms")
    .select(`
      *,
      employee:employees(*),
      form_assets(
        *,
        asset:assets!form_assets_asset_id_fkey(*),
        old_asset:assets!form_assets_old_asset_id_fkey(*)
      ),
      submission:form_submissions(*)
    `)
    .eq("id", id)
    .single();

  if (error || !form) notFound();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["email_default_to", "email_default_cc", "email_subject_template", "email_body_template"]);

  const sm = Object.fromEntries((settings || []).map((s) => [s.key, s.value]));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const fullLink = `${appUrl}/form/${form.token}`;

  return (
    <FormDetailClient
      form={{
        ...(form as Form),
        employee: form.employee as unknown as Employee,
        form_assets: form.form_assets as unknown as (FormAsset & { asset?: Asset; old_asset?: Asset })[],
        submission: form.submission as unknown as FormSubmission | undefined,
        fullLink,
      }}
      emailSettings={{
        default_to: sm.email_default_to || "",
        default_cc: sm.email_default_cc || "",
        subject_template: sm.email_subject_template || "",
        body_template: sm.email_body_template || "",
      }}
      adminName={user.full_name}
    />
  );
}

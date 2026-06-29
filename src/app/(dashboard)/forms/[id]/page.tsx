import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormDetailClient } from "@/components/forms/form-detail-client";
import type { Form, FormAsset, FormSubmission, Employee, Asset } from "@/types";

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from("forms")
    .select(`
      *,
      employee:employees(*),
      form_assets(
        *,
        asset:assets(*),
        old_asset:assets!form_assets_old_asset_id_fkey(*)
      ),
      submission:form_submissions(*)
    `)
    .eq("id", id)
    .single();

  if (error || !form) notFound();

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
    />
  );
}

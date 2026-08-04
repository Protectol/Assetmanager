import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, canManageLabelTemplates } from "@/lib/auth";
import { LabelDesigner } from "@/components/label-designer/label-designer";
import type { LabelTemplate } from "@/types";

interface EditLabelTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLabelTemplatePage({ params }: EditLabelTemplatePageProps) {
  const { id } = await params;
  const user = await requireAuth();
  if (!canManageLabelTemplates(user.role)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: template } = await supabase
    .from("label_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!template) notFound();

  return <LabelDesigner initialTemplate={template as LabelTemplate} />;
}

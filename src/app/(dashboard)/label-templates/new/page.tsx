import { requireAuth, canManageLabelTemplates } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LabelDesigner } from "@/components/label-designer/label-designer";

export default async function NewLabelTemplatePage() {
  const user = await requireAuth();
  if (!canManageLabelTemplates(user.role)) {
    redirect("/dashboard");
  }

  return <LabelDesigner />;
}

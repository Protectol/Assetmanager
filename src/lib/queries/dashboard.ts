import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardStats, Notification, AssetHistory } from "@/types";

export async function getDashboardStats(supabase: SupabaseClient): Promise<DashboardStats> {
  const [
    { count: totalAssets },
    { count: assignedAssets },
    { count: availableAssets },
    { count: damagedAssets },
    { count: lostAssets },
    { count: totalEmployees },
    { count: pendingForms },
    { count: completedForms },
  ] = await Promise.all([
    supabase.from("assets").select("*", { count: "exact", head: true }),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "assigned"),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("condition", "damaged"),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "lost"),
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("forms").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("forms").select("*", { count: "exact", head: true }).eq("status", "completed"),
  ]);

  return {
    totalAssets: totalAssets || 0,
    assignedAssets: assignedAssets || 0,
    availableAssets: availableAssets || 0,
    damagedAssets: damagedAssets || 0,
    lostAssets: lostAssets || 0,
    totalEmployees: totalEmployees || 0,
    pendingForms: pendingForms || 0,
    completedForms: completedForms || 0,
  };
}

export async function getRecentHistory(supabase: SupabaseClient, limit = 10): Promise<AssetHistory[]> {
  const { data } = await supabase
    .from("asset_history")
    .select(`
      *,
      employee:employees!asset_history_employee_id_fkey(id, employee_name, employee_id),
      asset:assets(id, asset_name, asset_tag),
      previous_holder:employees!asset_history_previous_holder_id_fkey(id, employee_name),
      current_holder:employees!asset_history_current_holder_id_fkey(id, employee_name),
      performer:users(id, full_name)
    `)
    .order("date", { ascending: false })
    .limit(limit);

  return (data as AssetHistory[]) || [];
}

export async function getNotifications(supabase: SupabaseClient): Promise<Notification[]> {
  const notifications: Notification[] = [];

  const { data: pendingForms } = await supabase
    .from("forms")
    .select("id, token, employee:employees(employee_name), created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  pendingForms?.forEach((form) => {
    const employee = form.employee as unknown as { employee_name: string };
    notifications.push({
      id: `pending-${form.id}`,
      type: "pending_response",
      title: "Pending Employee Response",
      message: `Waiting for ${employee?.employee_name || "employee"} to complete form`,
      link: `/forms/${form.id}`,
      created_at: form.created_at,
    });
  });

  const { data: expiredForms } = await supabase
    .from("forms")
    .select("id, employee:employees(employee_name), expires_at")
    .eq("status", "expired")
    .order("expires_at", { ascending: false })
    .limit(5);

  expiredForms?.forEach((form) => {
    const employee = form.employee as unknown as { employee_name: string };
    notifications.push({
      id: `expired-${form.id}`,
      type: "expired_link",
      title: "Expired Form Link",
      message: `Form for ${employee?.employee_name || "employee"} has expired`,
      link: `/forms/${form.id}`,
      created_at: form.expires_at,
    });
  });

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data: warrantyAssets } = await supabase
    .from("assets")
    .select("id, asset_name, asset_tag, warranty_expiry")
    .not("warranty_expiry", "is", null)
    .lte("warranty_expiry", thirtyDaysFromNow.toISOString().split("T")[0])
    .gte("warranty_expiry", new Date().toISOString().split("T")[0])
    .limit(5);

  warrantyAssets?.forEach((asset) => {
    notifications.push({
      id: `warranty-${asset.id}`,
      type: "warranty_expiry",
      title: "Warranty Expiring Soon",
      message: `${asset.asset_name} (${asset.asset_tag}) warranty expires ${asset.warranty_expiry}`,
      link: `/assets/${asset.id}`,
      created_at: asset.warranty_expiry,
    });
  });

  return notifications.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

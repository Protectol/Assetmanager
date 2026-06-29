import {
  Package,
  PackageCheck,
  PackageOpen,
  AlertTriangle,
  PackageX,
  Users,
  FileClock,
  FileCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats, getRecentHistory, getNotifications } from "@/lib/queries/dashboard";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PendingActions } from "@/components/dashboard/pending-actions";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [stats, recentHistory, notifications] = await Promise.all([
    getDashboardStats(supabase),
    getRecentHistory(supabase),
    getNotifications(supabase),
  ]);

  const { data: pendingForms } = await supabase
    .from("forms")
    .select(`
      *,
      employee:employees(id, employee_name, employee_id, department)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your asset management system</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Assets" value={stats.totalAssets} icon={Package} />
        <StatsCard title="Assigned" value={stats.assignedAssets} icon={PackageCheck} color="blue" />
        <StatsCard title="Available" value={stats.availableAssets} icon={PackageOpen} color="green" />
        <StatsCard title="Damaged" value={stats.damagedAssets} icon={AlertTriangle} color="amber" />
        <StatsCard title="Lost" value={stats.lostAssets} icon={PackageX} color="red" />
        <StatsCard title="Employees" value={stats.totalEmployees} icon={Users} color="purple" />
        <StatsCard title="Pending Forms" value={stats.pendingForms} icon={FileClock} color="yellow" />
        <StatsCard title="Completed Forms" value={stats.completedForms} icon={FileCheck} color="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity history={recentHistory} />
        </div>
        <div className="space-y-6">
          <PendingActions forms={pendingForms || []} />
          <NotificationsPanel notifications={notifications} />
        </div>
      </div>
    </div>
  );
}

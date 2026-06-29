import { createClient } from "@/lib/supabase/server";
import { requireAuth, canManageUsers } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SettingsForm } from "@/components/settings/settings-form";
import type { User } from "@/types";

export default async function SettingsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: settings } = await supabase.from("app_settings").select("*");

  const settingsMap = Object.fromEntries((settings || []).map((s) => [s.key, s.value]));

  let users: User[] = [];
  if (canManageUsers(user.role)) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    users = (data || []) as User[];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage application configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Company information and form configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            initialSettings={{
              company_name: settingsMap.company_name || process.env.NEXT_PUBLIC_COMPANY_NAME || "",
              company_logo_url: settingsMap.company_logo_url || "",
              form_link_expiry_days:
                settingsMap.form_link_expiry_days ||
                process.env.NEXT_PUBLIC_FORM_LINK_EXPIRY_DAYS ||
                "7",
            }}
            isAdmin={canManageUsers(user.role)}
          />
        </CardContent>
      </Card>

      {canManageUsers(user.role) && (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Internal users with access to the system</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={u.role} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={u.is_active ? "active" : "inactive"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

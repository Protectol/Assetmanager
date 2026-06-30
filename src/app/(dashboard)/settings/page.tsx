import { createClient } from "@/lib/supabase/server";
import { requireAuth, canManageUsers } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SettingsForm } from "@/components/settings/settings-form";
import { EmailSettingsForm, CategorySettingsForm } from "@/components/settings/advanced-settings-forms";
import type { User } from "@/types";

export default async function SettingsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: settings } = await supabase.from("app_settings").select("*");
  const sm = Object.fromEntries((settings || []).map((s) => [s.key, s.value]));

  const isAdmin = canManageUsers(user.role);

  let users: User[] = [];
  if (isAdmin) {
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    users = (data || []) as User[];
  }

  const categories: string[] = sm.asset_categories ? JSON.parse(sm.asset_categories) : [];

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
              company_name: sm.company_name || process.env.NEXT_PUBLIC_COMPANY_NAME || "",
              company_logo_url: sm.company_logo_url || "",
              form_link_expiry_days: sm.form_link_expiry_days || process.env.NEXT_PUBLIC_FORM_LINK_EXPIRY_DAYS || "7",
            }}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asset Categories</CardTitle>
          <CardDescription>
            Categories shown in the Current Asset Verification form. Drag to reorder or add/remove categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategorySettingsForm initialCategories={categories} isAdmin={isAdmin} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outlook Email Template</CardTitle>
          <CardDescription>
            Pre-filled email template used when sending Asset Assignment emails after approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailSettingsForm
            initial={{
              email_default_to: sm.email_default_to || "",
              email_default_cc: sm.email_default_cc || "",
              email_subject_template: sm.email_subject_template || "",
              email_body_template: sm.email_body_template || "",
            }}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      {isAdmin && (
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
                      <TableCell><StatusBadge status={u.role} /></TableCell>
                      <TableCell><StatusBadge status={u.is_active ? "active" : "inactive"} /></TableCell>
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

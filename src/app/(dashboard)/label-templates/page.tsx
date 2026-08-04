import Link from "next/link";
import { Plus, Tag, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canManageLabelTemplates } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { LabelTemplate } from "@/types";

export default async function LabelTemplatesPage() {
  const user = await getCurrentUser();
  const canManage = user ? canManageLabelTemplates(user.role) : false;

  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("label_templates")
    .select("*")
    .order("created_at", { ascending: false });

  const templateList = (templates || []) as LabelTemplate[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Asset Label Templates</h2>
          <p className="text-muted-foreground">
            Design and manage printable tag label templates for your hardware inventory
          </p>
        </div>
        {canManage && (
          <Button asChild className="gap-1.5">
            <Link href="/label-templates/new">
              <Plus className="h-4 w-4" />
              Create New Template
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Label Templates ({templateList.length})</CardTitle>
          <CardDescription>
            Reusable label sticker designs configured with dimensions, font styles, and QR placement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templateList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg">
              <Tag className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No label templates configured yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Create custom label dimensions and layouts for your sticker printers.
              </p>
              {canManage && (
                <Button asChild size="sm">
                  <Link href="/label-templates/new">Create First Template</Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templateList.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium">{tpl.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {tpl.width_mm}mm × {tpl.height_mm}mm
                    </TableCell>
                    <TableCell>
                      {tpl.is_default ? (
                        <Badge variant="default">Default Template</Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateTime(tpl.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <Button variant="ghost" size="sm" asChild className="gap-1">
                          <Link href={`/label-templates/${tpl.id}`}>
                            <Pencil className="h-4 w-4" />
                            Edit / Customize
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

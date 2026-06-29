import { Building2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Supabase Setup Required</CardTitle>
          <CardDescription>
            Add your Supabase credentials to <code className="rounded bg-muted px-1">.env.local</code>{" "}
            to run this app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ol className="list-decimal space-y-4 pl-5 text-sm">
            <li>
              Create a project at{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                supabase.com/dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              Open <strong>Project Settings → API</strong> and copy your Project URL and anon key.
            </li>
            <li>
              Edit <code className="rounded bg-muted px-1">.env.local</code> in the project root:
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-xs">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...`}
              </pre>
            </li>
            <li>
              Run the database migration in Supabase SQL Editor:
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-xs">
                supabase/migrations/001_initial_schema.sql
              </pre>
            </li>
            <li>
              Create an internal user in Supabase Auth with metadata:
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-xs">
{`{ "full_name": "Admin User", "role": "admin" }`}
              </pre>
            </li>
            <li>Restart the dev server: <code className="rounded bg-muted px-1">npm run dev</code></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

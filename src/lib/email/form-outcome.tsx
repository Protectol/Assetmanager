import "server-only";

import type { CSSProperties, ReactNode } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

type FormOutcome = "completed" | "approved" | "rejected";

interface SendFormOutcomeEmailParams {
  supabase: SupabaseClient;
  formId: string;
  outcome: FormOutcome;
  reviewedBy?: string;
  reason?: string;
  assetIds?: string[];
}

interface DeclaredAsset {
  category: string;
  has_asset: boolean;
  fields?: Record<string, string>;
  condition?: string;
  remarks?: string;
}

interface AssetRecord {
  asset_name: string;
  asset_type: string;
  asset_tag: string;
  serial_number?: string | null;
  condition?: string | null;
}

interface FormAssetRecord {
  condition?: string | null;
  remarks?: string | null;
  verified?: boolean | null;
  asset?: AssetRecord | null;
  old_asset?: AssetRecord | null;
}

interface FormEmailRecord {
  id: string;
  action_type: string;
  notes?: string | null;
  employee?: {
    employee_name: string;
    employee_id: string;
    department: string;
    designation: string;
    location: string;
    email: string;
  } | null;
  form_assets?: FormAssetRecord[];
  submission?: {
    submitted_at: string;
    submission_data?: { declared_assets?: DeclaredAsset[] } | null;
  } | null;
}

interface EmailAssetRow {
  name: string;
  type: string;
  tag: string;
  serial: string;
  condition: string;
  verification: string;
  remarks: string;
}

export interface FormEmailResult {
  sent: boolean;
  id?: string;
  reason?: "not_configured" | "no_recipients" | "form_not_found" | "send_failed";
  error?: string;
}

const ACTION_LABELS: Record<string, string> = {
  onboarding: "Asset Handover",
  exchange: "Asset Exchange",
  return: "Asset Return / Clearance",
  verification: "Asset Verification",
  current_verification: "Current Asset Verification",
};

const OUTCOME_LABELS: Record<FormOutcome, string> = {
  completed: "Completed",
  approved: "Approved",
  rejected: "Rejected / Cancelled",
};

export async function sendFormOutcomeEmail({
  supabase,
  formId,
  outcome,
  reviewedBy,
  reason,
  assetIds,
}: SendFormOutcomeEmailParams): Promise<FormEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { sent: false, reason: "not_configured" };

  const { data, error } = await supabase
    .from("forms")
    .select(`
      id, action_type, notes,
      employee:employees(employee_name, employee_id, department, designation, location, email),
      form_assets(
        condition, remarks, verified,
        asset:assets!form_assets_asset_id_fkey(asset_name, asset_type, asset_tag, serial_number, condition),
        old_asset:assets!form_assets_old_asset_id_fkey(asset_name, asset_type, asset_tag, serial_number, condition)
      ),
      submission:form_submissions(submitted_at, submission_data)
    `)
    .eq("id", formId)
    .single();

  if (error || !data) {
    console.error("Unable to load form for outcome email:", error);
    return { sent: false, reason: "form_not_found", error: error?.message };
  }

  const form = data as unknown as FormEmailRecord;
  if (!form.employee) return { sent: false, reason: "form_not_found" };

  const { data: settingsRows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", [
      "company_name",
      "email_default_to",
      "email_default_cc",
      "email_subject_template",
      "email_body_template",
    ]);

  const settings = Object.fromEntries((settingsRows || []).map((row) => [row.key, row.value]));
  const employeeEmail = form.employee.email?.trim();
  const operationalTo = parseAddresses(settings.email_default_to);
  const operationalCc = parseAddresses(settings.email_default_cc);
  const to = outcome === "rejected"
    ? uniqueAddresses(employeeEmail ? [employeeEmail] : operationalTo)
    : uniqueAddresses(operationalTo.length ? operationalTo : employeeEmail ? [employeeEmail] : []);
  const cc = outcome === "rejected"
    ? uniqueAddresses([...operationalTo, ...operationalCc]).filter((address) => !to.includes(address))
    : uniqueAddresses([...operationalCc, ...(employeeEmail ? [employeeEmail] : [])]).filter(
        (address) => !to.includes(address)
      );

  if (!to.length) return { sent: false, reason: "no_recipients" };

  const companyName = settings.company_name || process.env.NEXT_PUBLIC_COMPANY_NAME || "Asset Management";
  const actionLabel = ACTION_LABELS[form.action_type] || titleCase(form.action_type);
  const outcomeLabel = OUTCOME_LABELS[outcome];
  let rows = getAssetRows(form);
  if (form.action_type === "current_verification" && assetIds?.length) {
    const { data: approvedAssets } = await supabase
      .from("assets")
      .select("asset_name, asset_type, asset_tag, serial_number, condition")
      .in("id", assetIds);
    if (approvedAssets?.length) {
      rows = approvedAssets.map((asset) => ({
        name: asset.asset_name,
        type: asset.asset_type,
        tag: asset.asset_tag,
        serial: asset.serial_number || "—",
        condition: titleCase(asset.condition || "good"),
        verification: "Approved and assigned",
        remarks: "Added to the asset register",
      }));
    }
  }
  const completedAt = form.submission?.submitted_at || new Date().toISOString();
  const replacements = buildReplacements({ form, rows, actionLabel, outcomeLabel, completedAt, reviewedBy, reason });
  const subject = replaceTokens(
    settings.email_subject_template?.trim() || `[Verification Type] - [Outcome] - [Team Member Name] ([Team Member ID])`,
    replacements
  );
  const message = replaceTokens(
    settings.email_body_template?.trim() || defaultMessage(outcome, actionLabel, form.employee.employee_name),
    replacements
  );
  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME?.trim() || `${companyName} Asset Manager`;

  try {
    const html = await render(
      FormOutcomeEmail({
        companyName,
        actionLabel,
        outcome,
        outcomeLabel,
        message,
        form,
        rows,
        completedAt,
        reviewedBy,
        reason,
      })
    );
    const { data: sendData, error: sendError } = await resend.emails.send(
      {
        from: `${fromName} <${fromEmail}>`,
        to,
        cc: cc.length ? cc : undefined,
        replyTo: process.env.RESEND_REPLY_TO?.trim() || employeeEmail || undefined,
        subject,
        html,
        text: buildPlainText({ companyName, actionLabel, outcomeLabel, message, form, rows, completedAt, reviewedBy, reason }),
      },
      { headers: { "Idempotency-Key": `form-outcome-${formId}-${outcome}` } }
    );

    if (sendError) {
      console.error("Resend form outcome email failed:", sendError);
      return { sent: false, reason: "send_failed", error: sendError.message };
    }
    return { sent: true, id: sendData?.id };
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Unknown email error";
    console.error("Resend form outcome email failed:", sendError);
    return { sent: false, reason: "send_failed", error: message };
  }
}

function getAssetRows(form: FormEmailRecord): EmailAssetRow[] {
  if (form.action_type === "current_verification") {
    return (form.submission?.submission_data?.declared_assets || [])
      .filter((item) => item.has_asset)
      .map((item) => {
        const fields = item.fields || {};
        return {
          name: [item.category, fields.brand, fields.model, fields.size ? `${fields.size}\"` : ""].filter(Boolean).join(" "),
          type: item.category,
          tag: "Generated after approval",
          serial: fields.serial_number || fields.imei || fields.sim_number || fields.card_number || "—",
          condition: titleCase(item.condition || "good"),
          verification: "Declared by team member",
          remarks: item.remarks || "—",
        };
      });
  }

  return (form.form_assets || []).map((item) => {
    const exchangeText = item.old_asset
      ? `Replaced ${item.old_asset.asset_name} (${item.old_asset.asset_tag})`
      : "—";
    return {
      name: item.asset?.asset_name || "—",
      type: item.asset?.asset_type || "—",
      tag: item.asset?.asset_tag || "—",
      serial: item.asset?.serial_number || "—",
      condition: titleCase(item.condition || item.asset?.condition || "—"),
      verification: item.verified == null ? exchangeText : item.verified ? "Verified" : "Discrepancy reported",
      remarks: item.remarks || exchangeText,
    };
  });
}

function buildReplacements({ form, rows, actionLabel, outcomeLabel, completedAt, reviewedBy, reason }: {
  form: FormEmailRecord;
  rows: EmailAssetRow[];
  actionLabel: string;
  outcomeLabel: string;
  completedAt: string;
  reviewedBy?: string;
  reason?: string;
}) {
  const employee = form.employee!;
  const assetList = rows.length
    ? rows.map((row, index) => `${index + 1}. ${row.name} | ${row.tag} | ${row.serial} | ${row.condition} | ${row.remarks}`).join("\n")
    : "No assets were declared or included.";
  return {
    "[Team Member Name]": employee.employee_name,
    "[Employee Name]": employee.employee_name,
    "[Team Member ID]": employee.employee_id,
    "[Employee ID]": employee.employee_id,
    "[Department]": employee.department,
    "[Designation]": employee.designation,
    "[Location]": employee.location,
    "[Verification Type]": actionLabel,
    "[Outcome]": outcomeLabel,
    "[Status]": outcomeLabel,
    "[Asset Table]": assetList,
    "[Admin Name]": reviewedBy || "Asset Management Team",
    "[Date]": formatDate(completedAt),
    "[Reason]": reason || "Not applicable",
    "[Form ID]": form.id,
  };
}

function FormOutcomeEmail({ companyName, actionLabel, outcome, outcomeLabel, message, form, rows, completedAt, reviewedBy, reason }: {
  companyName: string;
  actionLabel: string;
  outcome: FormOutcome;
  outcomeLabel: string;
  message: string;
  form: FormEmailRecord;
  rows: EmailAssetRow[];
  completedAt: string;
  reviewedBy?: string;
  reason?: string;
}): ReactNode {
  const employee = form.employee!;
  const approved = outcome !== "rejected";
  const accent = approved ? "#047857" : "#b91c1c";
  const pale = approved ? "#ecfdf5" : "#fef2f2";
  return (
    <div style={{ backgroundColor: "#f3f4f6", padding: "28px 12px", fontFamily: "Arial, sans-serif", color: "#1f2937" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "24px 30px" }}>
          <div style={{ fontSize: "12px", letterSpacing: "1.4px", textTransform: "uppercase", color: "#cbd5e1" }}>Protectol Health</div>
          <h1 style={{ margin: "6px 0 0", fontSize: "24px", lineHeight: "32px" }}>{companyName} Asset Manager</h1>
        </div>
        <div style={{ padding: "28px 30px" }}>
          <div style={{ display: "inline-block", padding: "7px 12px", borderRadius: "999px", backgroundColor: pale, color: accent, fontSize: "13px", fontWeight: 700 }}>
            {actionLabel}: {outcomeLabel}
          </div>
          <div style={{ margin: "22px 0", whiteSpace: "pre-line", fontSize: "14px", lineHeight: "22px" }}>{message}</div>
          <SectionTitle>Team Member Details</SectionTitle>
          <InfoGrid rows={[
            ["Name", employee.employee_name], ["Team Member ID", employee.employee_id],
            ["Department", employee.department], ["Designation", employee.designation],
            ["Location", employee.location], ["Email", employee.email],
          ]} />
          <SectionTitle>Verification Details</SectionTitle>
          <InfoGrid rows={[
            ["Verification type", actionLabel], ["Outcome", outcomeLabel],
            ["Submitted / completed", formatDateTime(completedAt)], ["Reviewed by", reviewedBy || "System workflow"],
            ["Form reference", form.id],
            ...(reason ? [["Reason", reason] as [string, string]] : []),
            ...(form.notes ? [["Form notes", form.notes] as [string, string]] : []),
          ]} />
          <SectionTitle>Asset Details ({rows.length})</SectionTitle>
          {rows.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead><tr style={{ backgroundColor: "#f8fafc" }}>
                  {['Asset', 'Type', 'Asset Tag', 'Serial / ID', 'Condition', 'Verification', 'Remarks'].map((heading) => (
                    <th key={heading} style={tableHeaderStyle}>{heading}</th>
                  ))}
                </tr></thead>
                <tbody>{rows.map((row, index) => (
                  <tr key={`${row.tag}-${index}`}>
                    {[row.name, row.type, row.tag, row.serial, row.condition, row.verification, row.remarks].map((value, cellIndex) => (
                      <td key={cellIndex} style={tableCellStyle}>{value}</td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p style={{ fontSize: "14px", color: "#64748b" }}>No assets were declared or included in this form.</p>}
          <div style={{ marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #e5e7eb", fontSize: "12px", lineHeight: "18px", color: "#64748b" }}>
            This is an automated record from the {companyName} Asset Manager. Please retain it for operational and audit purposes.
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 style={{ margin: "24px 0 10px", fontSize: "15px", color: "#0f172a" }}>{children}</h2>;
}

function InfoGrid({ rows }: { rows: [string, string][] }) {
  return <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}><tbody>
    {rows.map(([label, value]) => <tr key={label}>
      <td style={{ ...tableCellStyle, width: "32%", fontWeight: 700, color: "#475569" }}>{label}</td>
      <td style={tableCellStyle}>{value || "—"}</td>
    </tr>)}
  </tbody></table>;
}

function buildPlainText({ companyName, actionLabel, outcomeLabel, message, form, rows, completedAt, reviewedBy, reason }: {
  companyName: string; actionLabel: string; outcomeLabel: string; message: string; form: FormEmailRecord;
  rows: EmailAssetRow[]; completedAt: string; reviewedBy?: string; reason?: string;
}) {
  const employee = form.employee!;
  const assets = rows.length
    ? rows.map((row, index) => `${index + 1}. ${row.name}\n   Type: ${row.type}\n   Tag: ${row.tag}\n   Serial/ID: ${row.serial}\n   Condition: ${row.condition}\n   Verification: ${row.verification}\n   Remarks: ${row.remarks}`).join("\n\n")
    : "No assets were declared or included.";
  return `${companyName} Asset Manager\n${actionLabel}: ${outcomeLabel}\n\n${message}\n\nTEAM MEMBER\nName: ${employee.employee_name}\nID: ${employee.employee_id}\nDepartment: ${employee.department}\nDesignation: ${employee.designation}\nLocation: ${employee.location}\nEmail: ${employee.email}\n\nVERIFICATION\nCompleted: ${formatDateTime(completedAt)}\nReviewed by: ${reviewedBy || "System workflow"}\nForm reference: ${form.id}${reason ? `\nReason: ${reason}` : ""}\n\nASSETS\n${assets}`;
}

function parseAddresses(value?: string) {
  return uniqueAddresses((value || "").split(/[;,]/).map((address) => address.trim()).filter(Boolean));
}
function uniqueAddresses(addresses: string[]) {
  return [...new Set(addresses.map((address) => address.toLowerCase()))];
}
function replaceTokens(template: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce((result, [token, value]) => result.replaceAll(token, value), template);
}
function defaultMessage(outcome: FormOutcome, action: string, employeeName: string) {
  return outcome === "rejected"
    ? `Dear ${employeeName},\n\nYour ${action.toLowerCase()} submission has been reviewed and could not be approved. Please review the reason below and contact the IT or HR team if you need assistance.`
    : `Dear Team,\n\nThe ${action.toLowerCase()} for ${employeeName} has been successfully ${outcome === "approved" ? "approved and recorded in the asset portal" : "completed"}. The full team member and asset details are provided below.`;
}
function titleCase(value: string) {
  if (!value || value === "—") return value;
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Dubai", timeZoneName: "short",
  }).format(new Date(value));
}

const tableHeaderStyle: CSSProperties = {
  border: "1px solid #e2e8f0", padding: "9px 8px", textAlign: "left", color: "#334155",
};
const tableCellStyle: CSSProperties = {
  border: "1px solid #e2e8f0", padding: "9px 8px", verticalAlign: "top",
};

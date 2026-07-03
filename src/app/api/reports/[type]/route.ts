import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth, isErrorResponse } from "@/lib/api-auth";
import { generateReportPDF } from "@/lib/pdf";
import { capitalize, formatDate, formatDateTime } from "@/lib/utils";
import * as XLSX from "xlsx";

const VALID_TYPES = [
  "employee-assets",
  "asset-history",
  "verification",
  "pending-forms",
  "returns",
  "laptops",
  "laptops-chargers",
  "k7-security"
] as const;

type ReportType = (typeof VALID_TYPES)[number];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const auth = await requireApiAuth();
  if (isErrorResponse(auth)) return auth;

  const { type } = await params;
  if (!VALID_TYPES.includes(type as ReportType)) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "company_name")
    .single();

  const companyName = settings?.value || process.env.NEXT_PUBLIC_COMPANY_NAME;

  let title = "";
  let headers: string[] = [];
  let rows: string[][] = [];

  switch (type as ReportType) {
    case "employee-assets": {
      title = "Team Member Asset Register";
      headers = ["Team Member", "ID", "Department", "Asset", "Type", "Tag", "Serial", "Condition", "Status"];
      const { data } = await supabase
        .from("asset_assignments")
        .select(`
          assigned_date,
          employee:employees(employee_name, employee_id, department),
          asset:assets(asset_name, asset_type, asset_tag, serial_number, condition, status)
        `)
        .eq("is_active", true)
        .order("assigned_date", { ascending: false });

      rows = (data || []).map((row) => {
        const emp = row.employee as unknown as { employee_name: string; employee_id: string; department: string } | null;
        const asset = row.asset as unknown as {
          asset_name: string;
          asset_type: string;
          asset_tag: string;
          serial_number?: string;
          condition: string;
          status: string;
        } | null;
        return [
          emp?.employee_name || "—",
          emp?.employee_id || "—",
          emp?.department || "—",
          asset?.asset_name || "—",
          asset?.asset_type || "—",
          asset?.asset_tag || "—",
          asset?.serial_number || "—",
          asset?.condition ? capitalize(asset.condition) : "—",
          asset?.status ? capitalize(asset.status) : "—",
        ];
      });
      break;
    }

    case "laptops":
    case "laptops-chargers": {
      const isLaptopsOnly = type === "laptops";
      title = isLaptopsOnly ? "Laptops Assigned Report" : "Laptops and Chargers Assigned Report";
      headers = ["Team Member", "ID", "Department", "Asset", "Type", "Tag", "Serial", "Condition", "Status"];
      const { data } = await supabase
        .from("asset_assignments")
        .select(`
          assigned_date,
          employee:employees(employee_name, employee_id, department),
          asset:assets(asset_name, asset_type, asset_tag, serial_number, condition, status)
        `)
        .eq("is_active", true)
        .order("assigned_date", { ascending: false });

      const filteredData = (data || []).filter((row) => {
        const asset = row.asset as unknown as { asset_type?: string } | null;
        if (!asset || !asset.asset_type) return false;
        const typeStr = asset.asset_type.toLowerCase();
        if (isLaptopsOnly) {
          return typeStr === "laptop";
        } else {
          return typeStr === "laptop" || typeStr.includes("charger") || typeStr.includes("adapter");
        }
      });

      rows = filteredData.map((row) => {
        const emp = row.employee as unknown as { employee_name: string; employee_id: string; department: string } | null;
        const asset = row.asset as unknown as {
          asset_name: string;
          asset_type: string;
          asset_tag: string;
          serial_number?: string;
          condition: string;
          status: string;
        } | null;
        return [
          emp?.employee_name || "—",
          emp?.employee_id || "—",
          emp?.department || "—",
          asset?.asset_name || "—",
          asset?.asset_type || "—",
          asset?.asset_tag || "—",
          asset?.serial_number || "—",
          asset?.condition ? capitalize(asset.condition) : "—",
          asset?.status ? capitalize(asset.status) : "—",
        ];
      });
      break;
    }

    case "asset-history": {
      title = "Asset History Report";
      headers = ["Date", "Action", "Team Member", "Asset", "Tag", "Remarks"];
      const { data } = await supabase
        .from("asset_history")
        .select(`
          date, action, remarks,
          employee:employees(employee_name),
          asset:assets(asset_name, asset_tag)
        `)
        .order("date", { ascending: false })
        .limit(500);

      rows = (data || []).map((row) => {
        const emp = row.employee as unknown as { employee_name: string } | null;
        const asset = row.asset as unknown as { asset_name: string; asset_tag: string } | null;
        return [
          formatDateTime(row.date),
          capitalize(row.action),
          emp?.employee_name || "—",
          asset?.asset_name || "—",
          asset?.asset_tag || "—",
          row.remarks || "—",
        ];
      });
      break;
    }

    case "verification": {
      title = "Verification Corrections Report";
      headers = ["Date", "Team Member Reported", "Condition", "Remarks", "Asset", "Tag", "Approved", "Applied"];
      const { data } = await supabase
        .from("verification_corrections")
        .select(`
          created_at, employee_reported, reported_condition, reported_remarks, admin_approved, applied,
          asset:assets(asset_name, asset_tag),
          form:forms(employee:employees(employee_name))
        `)
        .order("created_at", { ascending: false });

      rows = (data || []).map((row) => {
        const asset = row.asset as unknown as { asset_name: string; asset_tag: string } | null;
        return [
          formatDateTime(row.created_at),
          row.employee_reported ? "Yes" : "No",
          row.reported_condition ? capitalize(row.reported_condition) : "—",
          row.reported_remarks || "—",
          asset?.asset_name || "—",
          asset?.asset_tag || "—",
          row.admin_approved === true ? "Yes" : row.admin_approved === false ? "No" : "Pending",
          row.applied ? "Yes" : "No",
        ];
      });
      break;
    }

    case "pending-forms": {
      title = "Pending Forms Report";
      headers = ["Team Member", "ID", "Action", "Status", "Created", "Expires"];
      const { data } = await supabase
        .from("forms")
        .select(`
          action_type, status, created_at, expires_at,
          employee:employees(employee_name, employee_id)
        `)
        .eq("status", "pending")
        .order("expires_at", { ascending: true });

      rows = (data || []).map((row) => {
        const emp = row.employee as unknown as { employee_name: string; employee_id: string } | null;
        return [
          emp?.employee_name || "—",
          emp?.employee_id || "—",
          capitalize(row.action_type),
          capitalize(row.status),
          formatDateTime(row.created_at),
          formatDateTime(row.expires_at),
        ];
      });
      break;
    }

    case "returns": {
      title = "Asset Returns Report";
      headers = ["Date", "Team Member", "Asset", "Tag", "Condition", "Remarks"];
      const { data } = await supabase
        .from("asset_history")
        .select(`
          date, remarks,
          employee:employees(employee_name),
          asset:assets(asset_name, asset_tag, condition)
        `)
        .eq("action", "return")
        .order("date", { ascending: false });

      rows = (data || []).map((row) => {
        const emp = row.employee as unknown as { employee_name: string } | null;
        const asset = row.asset as unknown as { asset_name: string; asset_tag: string; condition: string } | null;
        return [
          formatDateTime(row.date),
          emp?.employee_name || "—",
          asset?.asset_name || "—",
          asset?.asset_tag || "—",
          asset?.condition ? capitalize(asset.condition) : "—",
          row.remarks || "—",
        ];
      });
      break;
    }

    case "k7-security": {
      title = "K7 Security Software Status Report";
      headers = ["Team Member", "Employee ID", "Department", "Laptop", "Serial Number", "K7 Installed", "Reason (if Not Installed)", "Submitted At"];
      const { data: k7Forms } = await supabase
        .from("forms")
        .select(`
          id, status,
          employee:employees(employee_name, employee_id, department),
          submission:form_submissions(submitted_at, submission_data)
        `)
        .eq("action_type", "current_verification")
        .in("status", ["completed", "approved"])
        .order("created_at", { ascending: false });

      for (const form of (k7Forms || [])) {
        const emp = form.employee as unknown as { employee_name: string; employee_id: string; department: string } | null;
        const sub = (form.submission as unknown as Array<{ submitted_at?: string; submission_data?: { declared_assets?: Array<{
          category: string; has_asset: boolean; fields?: Record<string, string>;
          k7_installed?: boolean; k7_reason?: string;
        }> } }>)?.[0];
        const declared = sub?.submission_data?.declared_assets || [];
        const laptopAsset = declared.find((a) => a.category === "Laptop" && a.has_asset);
        if (!laptopAsset) continue;

        const serial = laptopAsset.fields?.serial_number || "—";
        const laptopName = [laptopAsset.fields?.brand, laptopAsset.fields?.model].filter(Boolean).join(" ") || "Laptop";
        const k7Status = laptopAsset.k7_installed === true ? "Yes" : laptopAsset.k7_installed === false ? "No" : "Not Answered";
        const k7Reason = laptopAsset.k7_installed === false ? (laptopAsset.k7_reason || "—") : "—";

        rows.push([
          emp?.employee_name || "—",
          emp?.employee_id || "—",
          emp?.department || "—",
          laptopName,
          serial,
          k7Status,
          k7Reason,
          sub?.submitted_at ? formatDateTime(sub.submitted_at) : "—",
        ]);
      }
      break;
    }
  }

  const format = _request.nextUrl.searchParams.get("format");
  const isExcel = format === "excel" || format === "xlsx";
  const dateStr = formatDate(new Date()).replace(/,/g, "").replace(/ /g, "-");

  if (isExcel) {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const filename = `${type}-report-${dateStr}.xlsx`;
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const pdfBytes = generateReportPDF(title, headers, rows, companyName);
  const filename = `${type}-report-${dateStr}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

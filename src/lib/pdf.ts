import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Employee, Form, FormAsset, Asset } from "@/types";
import { formatDate, formatDateTime, capitalize } from "@/lib/utils";

interface PDFData {
  form: Form;
  employee: Employee;
  formAssets: (FormAsset & { asset?: Asset; old_asset?: Asset })[];
  signature: string;
  signatureType: "draw" | "type";
  companyName?: string;
}

const formTitles: Record<string, string> = {
  onboarding: "Asset Handover Form",
  exchange: "Asset Exchange Form",
  return: "Asset Return / Clearance Form",
  verification: "Asset Verification Form",
};

export function generateFormPDF(data: PDFData): Uint8Array {
  const doc = new jsPDF();
  const companyName = data.companyName || process.env.NEXT_PUBLIC_COMPANY_NAME || "Company";
  const title = formTitles[data.form.action_type] || "Asset Form";

  // Header
  doc.setFontSize(20);
  doc.setTextColor(45, 55, 72);
  doc.text(companyName, 105, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text(title, 105, 30, { align: "center" });

  doc.setDrawColor(226, 232, 240);
  doc.line(20, 35, 190, 35);

  // Team Member Information
  doc.setFontSize(12);
  doc.setTextColor(45, 55, 72);
  doc.text("Team Member Information", 20, 45);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const empInfo = [
    ["Name", data.employee.employee_name],
    ["Team Member ID", data.employee.employee_id],
    ["Department", data.employee.department],
    ["Designation", data.employee.designation],
    ["Location", data.employee.location],
    ["Email", data.employee.email],
  ];

  let yPos = 52;
  empInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(value, 70, yPos);
    yPos += 7;
  });

  // Assets Table
  yPos += 5;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 55, 72);
  doc.text("Assets", 20, yPos);
  yPos += 5;

  const isExchange = data.form.action_type === "exchange";
  const isVerification = data.form.action_type === "verification";

  const tableHeaders = isExchange
    ? ["Old Asset", "New Asset", "Tag", "Condition", "Remarks"]
    : isVerification
    ? ["Asset", "Tag", "Verified", "Condition", "Remarks"]
    : ["Asset Name", "Type", "Tag", "Serial", "Condition"];

  const tableData = data.formAssets.map((fa) => {
    const asset = fa.asset;
    if (isExchange) {
      return [
        fa.old_asset?.asset_name || "—",
        asset?.asset_name || "—",
        asset?.asset_tag || "—",
        fa.condition ? capitalize(fa.condition) : "—",
        fa.remarks || "—",
      ];
    }
    if (isVerification) {
      return [
        asset?.asset_name || "—",
        asset?.asset_tag || "—",
        fa.verified ? "Yes" : "No",
        fa.condition ? capitalize(fa.condition) : "—",
        fa.remarks || "—",
      ];
    }
    return [
      asset?.asset_name || "—",
      asset?.asset_type || "—",
      asset?.asset_tag || "—",
      asset?.serial_number || "—",
      fa.condition ? capitalize(fa.condition) : asset?.condition ? capitalize(asset.condition) : "—",
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [tableHeaders],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 91, 219], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 20 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Notes
  if (data.form.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.form.notes, 40, yPos);
    yPos += 10;
  }

  // Signatures section
  doc.setDrawColor(226, 232, 240);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  // Employee Signature
  doc.setFont("helvetica", "bold");
  doc.text("Team Member Signature:", 20, yPos);
  yPos += 5;

  if (data.signatureType === "draw" && data.signature.startsWith("data:")) {
    try {
      doc.addImage(data.signature, "PNG", 20, yPos, 60, 25);
      yPos += 30;
    } catch {
      doc.setFont("helvetica", "italic");
      doc.text("[Signature on file]", 20, yPos + 10);
      yPos += 15;
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(14);
    doc.text(data.signature, 20, yPos + 10);
    yPos += 20;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${formatDateTime(new Date())}`, 20, yPos);
  yPos += 15;

  // IT and HR placeholders
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 90, yPos);
  doc.line(110, yPos, 180, yPos);
  yPos += 5;
  doc.setFontSize(9);
  doc.text("IT Representative", 20, yPos);
  doc.text("HR Approval", 110, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated on ${formatDateTime(new Date())} | Form ID: ${data.form.id.slice(0, 8)}`,
    105,
    285,
    { align: "center" }
  );

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

export function generateReportPDF(
  title: string,
  headers: string[],
  rows: string[][],
  companyName?: string
): Uint8Array {
  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? "landscape" : "portrait" });
  const company = companyName || process.env.NEXT_PUBLIC_COMPANY_NAME || "Company";

  doc.setFontSize(18);
  doc.text(company, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });
  doc.setFontSize(14);
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 25, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Generated: ${formatDateTime(new Date())}`, doc.internal.pageSize.getWidth() / 2, 32, {
    align: "center",
  });

  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [59, 91, 219] },
    styles: { fontSize: 8 },
  });

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

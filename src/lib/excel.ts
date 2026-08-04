import * as XLSX from "xlsx";
import type { Employee, ImportPreviewRow } from "@/types";

export function exportEmployeesToExcel(employees: Employee[]): Buffer {
  const exportData = employees.map((emp) => ({
    "Employee ID": emp.employee_id,
    "Full Name": emp.employee_name,
    Department: emp.department,
    Designation: emp.designation,
    Location: emp.location,
    Email: emp.email,
    "Phone Number": emp.phone_number || "",
    Manager: emp.manager || "",
    Status: emp.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for clean template layout
  worksheet["!cols"] = [
    { wch: 15 }, // Employee ID
    { wch: 25 }, // Full Name
    { wch: 20 }, // Department
    { wch: 22 }, // Designation
    { wch: 18 }, // Location
    { wch: 28 }, // Email
    { wch: 18 }, // Phone Number
    { wch: 22 }, // Manager
    { wch: 12 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

export interface RawEmployeeRow {
  "Employee ID"?: string | number;
  "Full Name"?: string;
  Name?: string;
  Department?: string;
  Designation?: string;
  Location?: string;
  Email?: string;
  "Phone Number"?: string | number;
  Phone?: string | number;
  Manager?: string;
  Status?: string;
}

export function parseEmployeeExcel(buffer: Buffer): RawEmployeeRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<RawEmployeeRow>(worksheet, { defval: "" });
}

export function processEmployeeImportRows(
  rows: RawEmployeeRow[],
  existingEmployees: Employee[]
): {
  previewRows: ImportPreviewRow[];
  summary: {
    total: number;
    newCount: number;
    updateCount: number;
    invalidCount: number;
    duplicateCount: number;
  };
} {
  const existingMap = new Map<string, Employee>();
  const existingEmailMap = new Map<string, Employee>();

  existingEmployees.forEach((emp) => {
    if (emp.employee_id) existingMap.set(emp.employee_id.trim().toUpperCase(), emp);
    if (emp.email) existingEmailMap.set(emp.email.trim().toLowerCase(), emp);
  });

  const previewRows: ImportPreviewRow[] = [];
  const seenEmpIdsInFile = new Set<string>();

  let newCount = 0;
  let updateCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  rows.forEach((row, idx) => {
    const rowIndex = idx + 2; // Account for header row in Excel

    const rawEmpId = String(row["Employee ID"] || "").trim();
    const empName = String(row["Full Name"] || row["Name"] || "").trim();
    const dept = String(row["Department"] || "").trim();
    const desig = String(row["Designation"] || "").trim();
    const loc = String(row["Location"] || "").trim();
    const email = String(row["Email"] || "").trim();
    const phone = String(row["Phone Number"] || row["Phone"] || "").trim();
    const manager = String(row["Manager"] || "").trim();
    const status = String(row["Status"] || "active").toLowerCase().trim();

    const normalizedStatus = ["active", "inactive", "resigned", "on_leave"].includes(status)
      ? status
      : "active";

    // Validate required fields
    if (!empName) {
      invalidCount++;
      previewRows.push({
        row_index: rowIndex,
        employee_name: empName || "—",
        employee_id: rawEmpId,
        department: dept,
        designation: desig,
        location: loc,
        email: email,
        phone_number: phone,
        manager: manager,
        status: normalizedStatus,
        action_type: "invalid",
        validation_error: "Full Name is required.",
      });
      return;
    }

    if (!email || !email.includes("@")) {
      invalidCount++;
      previewRows.push({
        row_index: rowIndex,
        employee_name: empName,
        employee_id: rawEmpId,
        department: dept,
        designation: desig,
        location: loc,
        email: email || "—",
        phone_number: phone,
        manager: manager,
        status: normalizedStatus,
        action_type: "invalid",
        validation_error: "Valid Email address is required.",
      });
      return;
    }

    const empIdUpper = rawEmpId.toUpperCase();

    // Check duplicate in file
    if (empIdUpper && seenEmpIdsInFile.has(empIdUpper)) {
      duplicateCount++;
      previewRows.push({
        row_index: rowIndex,
        employee_name: empName,
        employee_id: rawEmpId,
        department: dept,
        designation: desig,
        location: loc,
        email: email,
        phone_number: phone,
        manager: manager,
        status: normalizedStatus,
        action_type: "duplicate",
        validation_error: `Duplicate Employee ID "${rawEmpId}" in import file.`,
      });
      return;
    }

    if (empIdUpper) {
      seenEmpIdsInFile.add(empIdUpper);
    }

    if (rawEmpId && existingMap.has(empIdUpper)) {
      // Existing matching record -> UPDATE
      updateCount++;
      previewRows.push({
        row_index: rowIndex,
        employee_name: empName,
        employee_id: rawEmpId,
        department: dept || existingMap.get(empIdUpper)!.department,
        designation: desig || existingMap.get(empIdUpper)!.designation,
        location: loc || existingMap.get(empIdUpper)!.location,
        email: email,
        phone_number: phone,
        manager: manager,
        status: normalizedStatus,
        action_type: "update",
      });
    } else if (!rawEmpId) {
      // Blank Employee ID -> NEW employee
      newCount++;
      previewRows.push({
        row_index: rowIndex,
        employee_name: empName,
        employee_id: "", // Will be auto-assigned if needed
        department: dept || "General",
        designation: desig || "Staff",
        location: loc || "Head Office",
        email: email,
        phone_number: phone,
        manager: manager,
        status: normalizedStatus,
        action_type: "new",
      });
    } else {
      // Employee ID specified but not found in existing -> NEW with specified ID
      newCount++;
      previewRows.push({
        row_index: rowIndex,
        employee_name: empName,
        employee_id: rawEmpId,
        department: dept || "General",
        designation: desig || "Staff",
        location: loc || "Head Office",
        email: email,
        phone_number: phone,
        manager: manager,
        status: normalizedStatus,
        action_type: "new",
      });
    }
  });

  return {
    previewRows,
    summary: {
      total: rows.length,
      newCount,
      updateCount,
      invalidCount,
      duplicateCount,
    },
  };
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdminUser } from "./admin-api";

export function getUserPlace(user: AdminUser): string {
  if (user.location && user.location.trim()) return user.location;
  const details = (user.profile_details || {}) as Record<string, any>;
  const basic = (details.basicDetails || details.mn_basic_details_draft || details) as Record<string, any>;
  return basic.presentLocation || basic.location || "—";
}

export function getMaritalStatus(user: AdminUser): string {
  const details = (user.profile_details || {}) as Record<string, any>;
  const basic = (details.basicDetails || details.mn_basic_details_draft || details) as Record<string, any>;
  return basic.maritalStatus || basic.marital_status || "—";
}

function getInactiveReasonText(user: AdminUser): string {
  if (user.status === "active") return "Active Member";
  if (user.status === "suspended") return "Suspended by Admin";
  if (user.last_login) {
    const days = Math.floor((Date.now() - new Date(user.last_login).getTime()) / (1000 * 60 * 60 * 24));
    if (days >= 30) return `Inactive (${days}d offline)`;
  }
  const completion = user.profileCompletion?.percentage ?? 0;
  if (completion < 50) return `Incomplete (${completion}%)`;
  return "Deactivated / Inactive";
}

export function exportUsersToPdf(users: AdminUser[], filterTitle: string = "Users List") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header Background Bar (Brand Dark Teal)
  doc.setFillColor(2, 109, 119);
  doc.rect(0, 0, 297, 24, "F");

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MALAPPURAM NIKAH MATRIMONY", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Official Member Audit Report — ${filterTitle.toUpperCase()}`, 14, 18);

  // Report Metadata Timestamp
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  const dateStr = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  doc.text(`Generated On: ${dateStr}  |  Total Members: ${users.length}`, 14, 30);

  // Table Data Mapping including Place, Marriage Status, Register Date, Call Status, Called Date, Customer Response
  const tableHead = [
    [
      "#",
      "Profile ID",
      "Member Name",
      "Mobile",
      "Gender",
      "Place",
      "Marriage Status",
      "Register Date",
      "Call Status",
      "Called Date",
      "Customer Response",
    ],
  ];

  const tableData = users.map((user, idx) => [
    idx + 1,
    user.profileId || (user.id ? `MN-${100000 + user.id}` : "—"),
    `${user.first_name || ""} ${user.last_name || ""}`.trim() || "—",
    user.mobile_number || "—",
    user.gender || "Male",
    getUserPlace(user),
    getMaritalStatus(user),
    user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "—",
    (user.call_status || "NOT_CALLED").replace("_", " ").toUpperCase(),
    user.called_date ? new Date(user.called_date).toLocaleDateString("en-IN") : "—",
    user.call_response || "—",
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableData,
    startY: 34,
    theme: "striped",
    headStyles: {
      fillColor: [2, 109, 119],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 20, fontStyle: "bold" },
      2: { cellWidth: 32, fontStyle: "bold" },
      3: { cellWidth: 26 },
      4: { cellWidth: 15 },
      5: { cellWidth: 24 },
      6: { cellWidth: 24 },
      7: { cellWidth: 22 },
      8: { cellWidth: 22 },
      9: { cellWidth: 22 },
      10: { cellWidth: 54 },
    },
    didDrawPage: (data) => {
      const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(pageStr, 297 - 25, 205);
    },
  });

  const sanitized = filterTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`malappuram_nikah_${sanitized}_${Date.now()}.pdf`);
}

export function exportUsersToCsv(users: AdminUser[], filterTitle: string = "Users Sheet") {
  const headers = [
    "#",
    "Profile ID",
    "First Name",
    "Last Name",
    "Mobile Number",
    "Email",
    "Gender",
    "Place (Location)",
    "Marriage Status",
    "Register Date",
    "Account Status",
    "KYC Status",
    "Call Status",
    "Called Date",
    "Customer Response (Last Remarks)",
  ];

  const escapeCsv = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = users.map((u, idx) => [
    idx + 1,
    u.profileId || (u.id ? `MN-${100000 + u.id}` : ""),
    u.first_name || "",
    u.last_name || "",
    u.mobile_number || "",
    u.email || "",
    u.gender || "Male",
    getUserPlace(u),
    getMaritalStatus(u),
    u.created_at ? new Date(u.created_at).toISOString().split("T")[0] : "",
    (u.status || "active").toUpperCase(),
    u.kyc_status || "NOT_SUBMITTED",
    (u.call_status || "NOT_CALLED").replace("_", " ").toUpperCase(),
    u.called_date ? new Date(u.called_date).toISOString().split("T")[0] : "",
    u.call_response || "",
  ]);

  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const sanitized = filterTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");
  link.setAttribute("href", url);
  link.setAttribute("download", `malappuram_nikah_${sanitized}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

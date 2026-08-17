import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdminUser } from "./admin-api";

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

  // Table Data Mapping
  const tableHead = [
    ["#", "Profile ID", "Member Name", "Mobile Number", "Email", "Gender", "Account Status", "Status Reason", "KYC Status", "Registered"]
  ];

  const tableData = users.map((user, idx) => [
    idx + 1,
    user.profileId || (user.id ? `MN-${100000 + user.id}` : "—"),
    `${user.first_name || ""} ${user.last_name || ""}`.trim() || "—",
    user.mobile_number || "—",
    user.email || "—",
    user.gender || "Male",
    (user.status || "active").toUpperCase().replace("_", " "),
    getInactiveReasonText(user),
    (user.kyc_status || "NOT_SUBMITTED").replace("_", " "),
    user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableData,
    startY: 34,
    theme: "striped",
    headStyles: {
      fillColor: [2, 109, 119],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left"
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 24, fontStyle: "bold" },
      2: { cellWidth: 38, fontStyle: "bold" },
      3: { cellWidth: 32 },
      4: { cellWidth: 42 },
      5: { cellWidth: 18 },
      6: { cellWidth: 26 },
      7: { cellWidth: 38 },
      8: { cellWidth: 26 },
      9: { cellWidth: 22 }
    },
    didDrawPage: (data) => {
      const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(pageStr, 297 - 25, 205);
    }
  });

  const sanitized = filterTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`malappuram_nikah_${sanitized}_${Date.now()}.pdf`);
}

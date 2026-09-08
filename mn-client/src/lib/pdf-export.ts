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

export function getUserAge(user: AdminUser): string {
  const details = (user.profile_details || {}) as Record<string, any>;
  const basic = (details.basicDetails || details.mn_basic_details_draft || details) as Record<string, any>;
  if (basic.age && !isNaN(Number(basic.age)) && Number(basic.age) > 0) {
    return String(basic.age);
  }
  if (user.dob) {
    const raw = String(user.dob).trim();
    let birthYear = NaN;
    if (/^\d{4}/.test(raw)) {
      birthYear = parseInt(raw.substring(0, 4), 10);
    } else if (/\d{4}$/.test(raw)) {
      birthYear = parseInt(raw.slice(-4), 10);
    }
    if (!isNaN(birthYear) && birthYear > 1900 && birthYear <= new Date().getFullYear()) {
      const calculated = new Date().getFullYear() - birthYear;
      if (calculated >= 18 && calculated <= 100) return `${calculated}`;
    }
  }
  return "—";
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

  // Table Data Mapping including Place, Marriage Status, Age, Plan, KYC, Register Date, Call Status, Called Date, Customer Response
  const tableHead = [
    [
      "#",
      "Profile ID",
      "Member Name",
      "Mobile",
      "Email ID",
      "Gender",
      "Age",
      "Place",
      "Marriage Status",
      "Plan",
      "KYC Status",
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
    user.email || "—",
    user.gender || "Male",
    getUserAge(user),
    getUserPlace(user),
    getMaritalStatus(user),
    user.is_premium ? "Premium" : "Free",
    user.kyc_status || "NOT_SUBMITTED",
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
      0: { cellWidth: 7 },
      1: { cellWidth: 16, fontStyle: "bold" },
      2: { cellWidth: 24, fontStyle: "bold" },
      3: { cellWidth: 22 },
      4: { cellWidth: 24 }, // Email ID
      5: { cellWidth: 11 }, // Gender
      6: { cellWidth: 10 }, // Age
      7: { cellWidth: 18 }, // Place
      8: { cellWidth: 18 }, // Marriage Status
      9: { cellWidth: 13, fontStyle: "bold" }, // Plan (Premium / Free)
      10: { cellWidth: 16 }, // KYC Status
      11: { cellWidth: 16 }, // Register Date
      12: { cellWidth: 18 }, // Call Status
      13: { cellWidth: 16 }, // Called Date
      14: { cellWidth: 35 }, // Customer Response
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
    "Age",
    "Place (Location)",
    "Marriage Status",
    "Membership Plan",
    "KYC Status",
    "Register Date",
    "Account Status",
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
    getUserAge(u),
    getUserPlace(u),
    getMaritalStatus(u),
    u.is_premium ? "Premium" : "Free",
    u.kyc_status || "NOT_SUBMITTED",
    u.created_at ? new Date(u.created_at).toISOString().split("T")[0] : "",
    (u.status || "active").toUpperCase(),
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

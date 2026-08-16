"use client";

import { Briefcase } from "lucide-react";
import AdminPageHeader from "./AdminPageHeader";

export default function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      <AdminPageHeader
        title={title}
        description={description || "This business management module is under development."}
        icon={Briefcase}
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Coming Soon</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          This module will be available in a future release. Vendor registration, bookings, reviews, and commission management are not yet implemented.
        </p>
      </div>
    </div>
  );
}

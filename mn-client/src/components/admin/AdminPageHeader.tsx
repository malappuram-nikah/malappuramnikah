"use client";

import { ShieldCheck, LucideIcon } from "lucide-react";

export default function AdminPageHeader({
  title,
  description,
  icon: Icon = ShieldCheck,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-brand-100 text-brand-700 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
              Super User
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] text-gray-400 font-semibold">Active Database Sync</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
            <Icon className="w-7 h-7 text-brand-600" /> {title}
          </h1>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 self-start md:self-center">{actions}</div>}
      </div>
    </header>
  );
}

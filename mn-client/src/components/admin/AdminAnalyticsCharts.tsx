"use client";

import { cn } from "@/lib/utils";

function maxValue(data: { value: number }[]) {
  return Math.max(...data.map((d) => d.value), 1);
}

export function VerticalBarChart({
  data,
  barClass = "bg-brand-500",
  height = 160,
}: {
  data: { label: string; value: number }[];
  barClass?: string;
  height?: number;
}) {
  const max = maxValue(data);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-end gap-1 min-w-max" style={{ height }}>
        {data.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 w-8 shrink-0">
            <span className="text-[9px] font-bold text-gray-600">{item.value || ""}</span>
            <div className="flex-1 w-full flex items-end">
              <div
                className={cn("w-full rounded-t-md transition-all min-h-[2px]", barClass)}
                style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%` }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <span className="text-[8px] text-gray-400 text-center leading-tight h-8 flex items-start justify-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBarChart({
  data,
  colors,
}: {
  data: { label: string; value: number }[];
  colors?: string[];
}) {
  const max = maxValue(data);
  const defaultColors = [
    "bg-brand-500",
    "bg-teal-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-emerald-500",
  ];

  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={item.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-600 capitalize">{item.label}</span>
            <span className="font-bold text-gray-900">{item.value}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", colors?.[i] || defaultColors[i % defaultColors.length])}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatMiniCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

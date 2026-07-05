import React from "react";

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl overflow-hidden border border-gray-100 p-0 flex flex-col justify-between shadow-xs animate-pulse"
        >
          <div className="relative h-44 bg-gray-100/85" />
          <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded-md w-3/4" />
              <div className="h-3 bg-gray-150 rounded-md w-1/2" />
              <div className="h-3 bg-gray-150 rounded-md w-1/3" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="flex-1 h-8 bg-gray-150 rounded-lg" />
              <div className="flex-1 h-8 bg-gray-150 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl overflow-hidden border border-gray-100 p-0 flex shadow-xs animate-pulse"
        >
          <div className="w-28 shrink-0 h-32 bg-gray-100/85" />
          <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded-md w-1/3" />
              <div className="h-3 bg-gray-150 rounded-md w-1/4" />
              <div className="h-3 bg-gray-150 rounded-md w-1/2" />
            </div>
            <div className="flex gap-2 pt-1 max-w-xs">
              <div className="flex-1 h-7 bg-gray-150 rounded-lg" />
              <div className="flex-1 h-7 bg-gray-150 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SlideOverSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Cover picture place */}
      <div className="h-48 bg-gray-100/85 rounded-xl" />
      
      {/* Name and base details */}
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded-md w-1/2" />
        <div className="h-4 bg-gray-150 rounded-md w-1/3" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 bg-gray-150 rounded-full w-16" />
          <div className="h-5 bg-gray-150 rounded-full w-20" />
          <div className="h-5 bg-gray-150 rounded-full w-24" />
        </div>
      </div>
      
      {/* Horizontal divider */}
      <div className="border-t border-gray-100" />
      
      {/* Sections */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded-md w-1/4" />
        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="h-2.5 bg-gray-150 rounded-md w-1/2 mb-1.5" />
              <div className="h-3.5 bg-gray-200 rounded-md w-3/4" />
            </div>
            <div>
              <div className="h-2.5 bg-gray-150 rounded-md w-1/2 mb-1.5" />
              <div className="h-3.5 bg-gray-200 rounded-md w-3/4" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded-md w-1/4" />
        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="h-2.5 bg-gray-150 rounded-md w-1/2 mb-1.5" />
              <div className="h-3.5 bg-gray-200 rounded-md w-3/4" />
            </div>
            <div>
              <div className="h-2.5 bg-gray-150 rounded-md w-1/2 mb-1.5" />
              <div className="h-3.5 bg-gray-200 rounded-md w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompareTableSkeleton() {
  return (
    <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs animate-pulse">
      {/* Header columns */}
      <div className="grid grid-cols-4 bg-gray-50/80 border-b border-gray-150 py-6 px-4 gap-4">
        <div className="col-span-1 space-y-2">
          <div className="h-3 bg-gray-150 rounded-md w-1/2" />
          <div className="h-6 bg-gray-200 rounded-md w-3/4" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="col-span-1 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="h-4 bg-gray-200 rounded-md w-2/3" />
            <div className="h-3 bg-gray-150 rounded-md w-1/2" />
          </div>
        ))}
      </div>
      
      {/* Parameter Rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, r) => (
          <div key={r} className="grid grid-cols-4 px-4 py-4 gap-4 items-center">
            <div className="col-span-1">
              <div className="h-3.5 bg-gray-200 rounded-md w-2/3" />
            </div>
            {Array.from({ length: 3 }).map((_, c) => (
              <div key={c} className="col-span-1">
                <div className="h-4 bg-gray-150 rounded-md w-5/6" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FullProfileSkeleton() {
  return (
    <div className="grid md:grid-cols-3 gap-6 animate-pulse">
      {/* Left Avatar Block */}
      <div className="md:col-span-1 bg-white rounded-xl border border-gray-150/80 overflow-hidden shadow-xs p-5 space-y-5">
        <div className="h-60 bg-gray-150 rounded-xl w-full" />
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded-md w-2/3" />
          <div className="h-3.5 bg-gray-150 rounded-md w-1/2" />
        </div>
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="h-4 bg-gray-150 rounded-md w-1/4" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 bg-gray-100 rounded-lg" />
            <div className="h-8 bg-gray-100 rounded-lg" />
            <div className="h-8 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
      
      {/* Right Details Block */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-150/80 shadow-xs space-y-3">
          <div className="h-5 bg-gray-200 rounded-md w-1/4" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-150 rounded-md w-full" />
            <div className="h-3 bg-gray-150 rounded-md w-11/12" />
            <div className="h-3 bg-gray-150 rounded-md w-4/5" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-150/80 shadow-xs space-y-4">
          <div className="h-5 bg-gray-200 rounded-md w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-150 rounded-md w-1/3" />
                <div className="h-4 bg-gray-200 rounded-md w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MatchesPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Highest Compatibility Match placeholder */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded-md w-1/4" />
        <div className="bg-gray-150 rounded-xl h-64 w-full" />
      </div>
      
      {/* Recommended Daily placeholder */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded-md w-1/4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 p-0 flex flex-col justify-between shadow-xs">
              <div className="h-44 bg-gray-100/80" />
              <div className="p-4 flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-3 bg-gray-150 rounded-md w-1/2" />
                </div>
                <div className="h-8 bg-gray-150 rounded-lg w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

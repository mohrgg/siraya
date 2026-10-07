import React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header with Selector Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56 mb-2 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg opacity-70" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* 2. Top Metric KPI Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-7 w-36 rounded-lg mb-1" />
              <Skeleton className="h-3 w-24 rounded opacity-60" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Interactive Chart (Kepadatan Rombel) */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <Skeleton className="h-6 w-56 rounded-lg mb-1" />
            <Skeleton className="h-3.5 w-80 max-w-full rounded opacity-70" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>

        {/* Chart Canvas Placeholder */}
        <div className="h-72 w-full flex items-end justify-between gap-4 pt-8 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <Skeleton 
                className="w-full max-w-[50px] rounded-t-lg" 
                style={{ height: `${30 + (i * 12) % 60}%` }} 
              />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Secondary Dual Grid (Demografi & Tren) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs h-72 flex flex-col justify-between">
          <div>
            <Skeleton className="h-5 w-44 rounded-lg mb-1" />
            <Skeleton className="h-3 w-64 rounded opacity-70" />
          </div>
          <div className="flex items-center justify-center my-4">
            <Skeleton className="w-36 h-36 rounded-full" />
          </div>
          <div className="flex justify-center gap-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs h-72 flex flex-col justify-between">
          <div>
            <Skeleton className="h-5 w-48 rounded-lg mb-1" />
            <Skeleton className="h-3 w-64 rounded opacity-70" />
          </div>
          <div className="h-40 w-full flex items-end justify-between gap-3 px-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${40 + (i * 15) % 55}%` }} />
            ))}
          </div>
          <div className="flex justify-between px-2">
            <Skeleton className="h-3 w-10 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSkeleton

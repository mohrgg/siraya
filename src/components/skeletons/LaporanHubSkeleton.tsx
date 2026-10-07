import React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

export function LaporanHubSkeleton() {
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Supervisory Card Skeleton */}
      <div className="p-6 bg-surface rounded-2xl border border-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-6 w-80 max-w-full" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-8 w-36 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Grid 3 Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between min-h-[220px]"
          >
            <div>
              {/* Icon Box */}
              <Skeleton className="w-12 h-12 rounded-2xl mb-5" />
              {/* Title */}
              <Skeleton className="h-6 w-48 mb-3" />
              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>

            {/* Bottom Action Link */}
            <div className="mt-6 flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LaporanHubSkeleton

import React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

interface TablePageSkeletonProps {
  title?: string
  subtitle?: string
  tabName?: string
  columnsCount?: number
  rowCount?: number
}

export function TablePageSkeleton({
  columnsCount = 5,
  rowCount = 7
}: TablePageSkeletonProps) {
  return (
    <div className="w-full animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-56 mb-2 rounded-xl" />
        <Skeleton className="h-4 w-80 max-w-full rounded-lg opacity-75" />
      </div>

      {/* 2. Main Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        {/* 3. Tab Header Wajib */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <div className="px-6 py-3 border-b-2 border-primary/40 flex items-center">
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
        </div>

        {/* 4. Toolbar: Search Bar, Dropdowns & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
            {/* Search Input Skeleton */}
            <div className="relative flex-1 min-w-[220px]">
              <div className="h-10 bg-bg border border-border rounded-xl flex items-center px-3.5 gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>

            {/* Filter Dropdown Skeleton */}
            <div className="h-10 w-36 bg-bg border border-border rounded-xl flex items-center px-3 justify-between">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
          </div>

          {/* Action Buttons Skeleton (Export / Add) */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-xl bg-primary/20" />
          </div>
        </div>

        {/* 5. Tabel Sesuai Aturan Unified Tabbed Card Layout */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                {Array.from({ length: columnsCount }).map((_, i) => (
                  <th key={i} className="py-3 px-4 font-semibold">
                    <Skeleton className={`h-3 ${i === 0 ? "w-12" : i === 1 ? "w-36" : "w-24"} rounded`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border hover:bg-gray-50/50 dark:hover:bg-surface-hover/30 transition-colors">
                  {Array.from({ length: columnsCount }).map((_, colIndex) => (
                    <td key={colIndex} className="py-4 px-4">
                      {colIndex === 0 ? (
                        <Skeleton className="h-4 w-8 rounded" />
                      ) : colIndex === 1 ? (
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-44 rounded-md" />
                          <Skeleton className="h-3 w-28 rounded opacity-60" />
                        </div>
                      ) : colIndex === columnsCount - 1 ? (
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                      ) : (
                        <Skeleton className="h-4 w-28 rounded" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 6. Pagination Footer Skeleton */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border text-xs">
          <Skeleton className="h-3.5 w-36 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TablePageSkeleton

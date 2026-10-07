import React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

export function TransactionDetailSkeleton() {
  return (
    <div className="w-full pb-24 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-36 rounded" />
          </div>
          <Skeleton className="h-8 w-60 rounded-xl" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        {/* Card Header with Tab Switcher */}
        <div className="px-6 py-4 border-b border-border bg-bg/50 flex justify-between items-center">
          <Skeleton className="h-5 w-36 rounded" />
          <div className="flex bg-surface border border-border rounded-lg p-0.5 gap-1">
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8 space-y-8">
          {/* 2-Column Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
            <div className="space-y-4">
              <div>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-5 w-48 rounded" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-5 w-52 rounded" />
              </div>
              <div>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-full max-w-sm rounded" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Skeleton className="h-3 w-28 mb-2" />
                <Skeleton className="h-5 w-40 rounded" />
              </div>
              <div>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-5 w-32 rounded" />
              </div>
            </div>
          </div>

          {/* Table Details */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="py-3 px-4"><Skeleton className="h-3 w-12" /></th>
                  <th className="py-3 px-4"><Skeleton className="h-3 w-32" /></th>
                  <th className="py-3 px-4 text-right"><Skeleton className="h-3 w-24 ml-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[1, 2].map((i) => (
                  <tr key={i}>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-8" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-44" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-28 ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Box */}
          <div className="flex justify-end pt-4 border-t border-border">
            <div className="w-64 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-32 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionDetailSkeleton

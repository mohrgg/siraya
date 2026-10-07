import React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

interface FormPageSkeletonProps {
  fieldsCount?: number
}

export function FormPageSkeleton({ fieldsCount = 4 }: FormPageSkeletonProps = {}) {
  return (
    <div className="w-full max-w-4xl space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header with Back Button */}
      <div className="space-y-3">
        <Skeleton className="h-9 w-32 rounded-xl" />
        <div>
          <Skeleton className="h-8 w-60 rounded-xl mb-1.5" />
          <Skeleton className="h-4 w-80 max-w-full rounded-lg opacity-70" />
        </div>
      </div>

      {/* 2. Main Form Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: fieldsCount }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-11 w-full rounded-xl bg-bg border border-border" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-24 w-full rounded-xl bg-bg border border-border" />
        </div>

        {/* 3. Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl bg-primary/20" />
        </div>
      </div>
    </div>
  )
}

export default FormPageSkeleton

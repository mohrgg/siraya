import React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

export function SettingsSkeleton() {
  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div>
        <Skeleton className="h-8 w-64 rounded-xl mb-2" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg opacity-70" />
      </div>

      {/* 2. Settings Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-surface rounded-2xl border border-border shadow-2xs overflow-x-auto">
        <Skeleton className="h-10 w-40 rounded-xl bg-primary/20" />
        <Skeleton className="h-10 w-44 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* 3. Settings Form Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <Skeleton className="h-5 w-48 rounded-lg mb-1" />
            <Skeleton className="h-3.5 w-72 rounded opacity-60" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl bg-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-11 w-full rounded-xl bg-bg border border-border" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-11 w-full rounded-xl bg-bg border border-border" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-20 w-full rounded-xl bg-bg border border-border" />
          </div>
        </div>

        {/* Logo / File Upload Placeholder */}
        <div className="p-4 bg-bg rounded-xl border border-border/80 flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-3 w-64 rounded opacity-60" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default SettingsSkeleton

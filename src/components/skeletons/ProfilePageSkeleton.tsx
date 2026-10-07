import React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

interface ProfilePageSkeletonProps {
  tabsCount?: number
}

export function ProfilePageSkeleton({ tabsCount = 4 }: ProfilePageSkeletonProps = {}) {
  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-xl bg-primary/20" />
        </div>
      </div>

      {/* 2. Hero Profile Banner Card (360° Profile) */}
      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Avatar Kotak Besar */}
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0" />

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-7 sm:h-8 w-64 max-w-full rounded-xl" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>
          </div>
        </div>

        {/* Hero KPI Card */}
        <div className="bg-bg border border-border rounded-xl p-4 shadow-2xs min-w-[200px] flex flex-col justify-center space-y-2">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-6 w-36 rounded-lg" />
        </div>
      </div>

      {/* 3. Modular Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-surface rounded-2xl border border-border shadow-2xs overflow-x-auto">
        {Array.from({ length: tabsCount }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-10 ${i === 0 ? "w-36 bg-primary/20" : i === 1 ? "w-44" : "w-36"} rounded-xl`}
          />
        ))}
      </div>

      {/* 4. Body Content Cards (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-5 w-36 rounded" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-5 w-32 rounded" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-5 w-40 rounded" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-5 w-28 rounded" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="space-y-3">
            <div className="h-12 bg-bg border border-border rounded-xl p-3 flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <div className="h-12 bg-bg border border-border rounded-xl p-3 flex items-center justify-between">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePageSkeleton

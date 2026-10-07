import React from "react"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-border/60 dark:bg-slate-800/60 ${className}`}
      {...props}
    />
  )
}

export default Skeleton

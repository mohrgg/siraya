"use client"

import React from "react"
import { ArrowLeftRight } from "lucide-react"

interface TableScrollHintProps {
  totalRows?: number
  className?: string
  message?: string
}

export function TableScrollHint({
  totalRows,
  className = "",
  message = "Geser tabel ke kanan untuk melihat kolom selengkapnya"
}: TableScrollHintProps) {
  return (
    <div
      className={`md:hidden flex items-center justify-between px-3.5 py-2 mb-2.5 bg-primary/5 border border-primary/15 rounded-xl text-xs text-primary font-medium select-none shadow-2xs ${className}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <ArrowLeftRight size={14} className="shrink-0 text-primary animate-pulse" />
        <span className="truncate text-[11px] sm:text-xs">{message}</span>
      </div>
      {totalRows !== undefined && (
        <span className="ml-2 px-2 py-0.5 bg-primary/10 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold shrink-0">
          {totalRows} data
        </span>
      )}
    </div>
  )
}

"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export interface BackButtonProps {
  href?: string
  onClick?: () => void
  label?: string
  shortLabel?: string
  iconOnlyOnMobile?: boolean
  className?: string
}

export function BackButton({
  href,
  onClick,
  label = "Kembali",
  shortLabel = "Kembali",
  iconOnlyOnMobile = false,
  className = ""
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick()
    } else if (!href) {
      e.preventDefault()
      router.back()
    }
  }

  const content = (
    <button
      type="button"
      onClick={handleClick}
      className={`group w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-bg text-text-main font-semibold text-xs transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer min-h-[44px] sm:min-h-[36px] short:min-h-[32px] shrink-0 ${className}`}
    >
      <ArrowLeft size={16} className="shrink-0 text-text-muted group-hover:text-text-main transition-colors" />
      <span className={iconOnlyOnMobile ? "hidden sm:inline truncate" : "truncate"}>
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{label}</span>
      </span>
    </button>
  )

  if (href) {
    return (
      <Link href={href} className="w-full sm:w-auto inline-flex shrink-0">
        {content}
      </Link>
    )
  }

  return content
}

export default BackButton

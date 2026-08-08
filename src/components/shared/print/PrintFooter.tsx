import React from "react"
import { Pengaturan } from "@prisma/client"

interface PrintFooterProps {
  pengaturan?: Pengaturan | null
  catatan?: string | null
  className?: string
}

export default function PrintFooter({ pengaturan, catatan, className = "hidden print:block" }: PrintFooterProps) {
  const footerText = catatan || pengaturan?.catatanKwitansi || "Dokumen ini dicetak secara otomatis dari Sistem Informasi Siraya."

  return (
    <div className={`${className} w-full mt-12 text-center text-xs text-gray-500 italic border-t border-gray-200 pt-4 break-inside-avoid`}>
      {footerText}
    </div>
  )
}

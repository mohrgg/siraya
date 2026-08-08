import React from "react"
import { Pengaturan } from "@prisma/client"

interface PrintFooterProps {
  pengaturan?: Pengaturan | null
  catatan?: string | null
  className?: string
}

export default function PrintFooter({ pengaturan, catatan, className = "hidden print:block" }: PrintFooterProps) {
  const customCatatan = catatan || pengaturan?.catatanKwitansi
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className={`${className} w-full mt-12 text-center text-xs text-gray-500 italic border-t border-gray-200 pt-4 break-inside-avoid`}>
      {customCatatan && <p className="mb-2">{customCatatan}</p>}
      <p>Dicetak melalui Sistem Informasi Siraya pada {dateStr}</p>
    </div>
  )
}

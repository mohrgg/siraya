import React from "react"
import { UnitSekolah, Pengaturan } from "@prisma/client"

interface Signatory {
  jabatan: string
  nama: string
}

interface PrintSignatureProps {
  pengaturan?: Partial<Pengaturan> | any
  unitInfo?: Partial<UnitSekolah> | any
  tipe: "tunggal" | "ganda"
  tanggal: Date | string
  kiri?: Signatory
  kanan: Signatory
  className?: string
}

export default function PrintSignature({ 
  pengaturan, 
  unitInfo, 
  tipe, 
  tanggal, 
  kiri, 
  kanan,
  className = "hidden print:flex"
}: PrintSignatureProps) {
  
  // Format Tanggal
  const dateStr = typeof tanggal === "string" 
    ? tanggal 
    : tanggal.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    
  // Prioritaskan kota Unit, jika kosong gunakan kota Pengaturan, jika kosong gunakan Bandung
  const kota = unitInfo?.kotaPenandatangan || pengaturan?.kotaPenandatangan || "Bandung"

  return (
    <div className={`${className} justify-between mt-8 mb-6 break-inside-avoid`}>
      {/* Tanda Tangan Kiri (Opsional) */}
      {tipe === "ganda" && kiri ? (
        <div className="text-center w-64">
          <p className="text-xs text-slate-700 min-h-[1.25rem] leading-relaxed mb-0.5">&nbsp;</p>
          <p className="text-xs font-semibold text-slate-800 leading-tight mb-16">{kiri.jabatan}</p>
          <p className="text-sm font-bold underline underline-offset-4 text-slate-900">{kiri.nama || "____________________"}</p>
        </div>
      ) : (
        <div className="w-64"></div> /* Spacer jika hanya tunggal agar kanan tetap di kanan */
      )}

      {/* Tanda Tangan Kanan (Wajib) */}
      <div className="text-center w-64">
        <p className="text-xs text-slate-700 min-h-[1.25rem] leading-relaxed mb-0.5">{kota}, {dateStr}</p>
        <p className="text-xs font-semibold text-slate-800 leading-tight mb-16">{kanan.jabatan}</p>
        <p className="text-sm font-bold underline underline-offset-4 text-slate-900">{kanan.nama || "____________________"}</p>
      </div>
    </div>
  )
}

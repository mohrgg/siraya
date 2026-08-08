import React from 'react'
import { PdfInstitutionInfo } from './pdf-types'

// ============================================================================
// 1. KOMPONEN KOP SURAT (HEADER)
// ============================================================================
interface PrintHeaderHtmlProps {
  institutionInfo: PdfInstitutionInfo
}

export function PrintHeaderHtml({ institutionInfo }: PrintHeaderHtmlProps) {
  const parts: string[] = []
  if (institutionInfo.alamat) parts.push(institutionInfo.alamat)
  if (institutionInfo.telepon) parts.push(`Telp: ${institutionInfo.telepon}`)
  if (institutionInfo.email) parts.push(`Email: ${institutionInfo.email}`)
  if (institutionInfo.website) parts.push(`Web: ${institutionInfo.website}`)
  const subtitle = parts.join(' \u2022 ')

  return (
    <div className="w-full mb-6">
      <div className="flex items-center mb-4">
        {/* Logo */}
        <div className="w-24 h-24 relative mr-6 flex-shrink-0">
          {institutionInfo.logoUrl ? (
            <img 
              src={institutionInfo.logoUrl} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          ) : null}
        </div>
        
        {/* Header Text */}
        <div className="flex-1 flex flex-col justify-center text-center">
          {institutionInfo.namaUnit ? (
            <>
              <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] text-slate-800 mb-1">
                {institutionInfo.namaYayasan || "YAYASAN AL BASYARIAH"}
              </h2>
              <h1 className="text-[26px] font-black uppercase tracking-[0.1em] text-slate-900 mb-2 leading-tight">
                {institutionInfo.namaUnit}
              </h1>
            </>
          ) : (
            <h1 className="text-[26px] font-black uppercase tracking-[0.1em] text-slate-900 mb-2 leading-tight mt-2">
              {institutionInfo.namaYayasan || "YAYASAN AL BASYARIAH"}
            </h1>
          )}
          <p className="text-[13px] text-slate-700 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
        
        {/* Balancer for centering (same width as logo + margin) */}
        <div className="w-24 ml-6 flex-shrink-0"></div>
      </div>
      
      {/* Double Border Line */}
      <div className="w-full border-b-[4px] border-slate-900 mb-[2px]"></div>
      <div className="w-full border-b-[1px] border-slate-900"></div>
    </div>
  )
}

// ============================================================================
// 2. KOMPONEN TANDA TANGAN (SIGNATURE)
// ============================================================================
interface PrintSignatureHtmlProps {
  kotaPenandatangan: string
  tanggalCetak: string | Date
  penandatanganKiri?: { jabatan: string; nama: string }
  penandatanganKanan?: { jabatan: string; nama: string }
  catatanKwitansi?: string | null
}

export function PrintSignatureHtml({ 
  kotaPenandatangan, 
  tanggalCetak, 
  penandatanganKiri, 
  penandatanganKanan,
  catatanKwitansi 
}: PrintSignatureHtmlProps) {
  const parsedDate = new Date(tanggalCetak)
  const dateStr = !isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : String(tanggalCetak)

  const renderSigner = (signer?: { jabatan: string; nama: string }, showDate: boolean = false) => {
    if (!signer) return <div className="w-48"></div> // Placeholder
    return (
      <div className="flex flex-col items-center text-sm w-64">
        <p className="mb-1 h-5">{showDate ? `${kotaPenandatangan}, ${dateStr}` : ""}</p>
        <p className="mb-20">{signer.jabatan}</p>
        <p className="font-bold underline underline-offset-4">{signer.nama}</p>
      </div>
    )
  }

  return (
    <div className="mt-12 break-inside-avoid">
      <div className="flex justify-between items-start w-full px-8">
        {renderSigner(penandatanganKiri, false)}
        {renderSigner(penandatanganKanan, true)}
      </div>
      
      {/* Footer / Notes */}
      <div className="mt-16 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 italic">
        {catatanKwitansi && <p className="mb-1">{catatanKwitansi}</p>}
        <p>Dicetak melalui Sistem Informasi Siraya pada {!isNaN(parsedDate.getTime()) ? parsedDate.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : String(tanggalCetak)}</p>
      </div>
    </div>
  )
}

// ============================================================================
// 3. LAYOUT TABEL REPORT (MASTER)
// ============================================================================
export interface TableReportData {
  institutionInfo: PdfInstitutionInfo
  title: string
  subtitle?: string
  headers: string[]
  data: any[][]
  tanggalCetak?: string | Date
  penandatanganKiri?: { jabatan: string; nama: string }
  penandatanganKanan?: { jabatan: string; nama: string }
}

export function TableReportHtml({
  institutionInfo,
  title,
  subtitle,
  headers,
  data,
  tanggalCetak = new Date(),
  penandatanganKiri,
  penandatanganKanan
}: TableReportData) {
  return (
    <div className="font-sans text-slate-900 bg-white">
      <PrintHeaderHtml institutionInfo={institutionInfo} />
      
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold uppercase tracking-wider text-emerald-700">{title}</h3>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>

      <table className="w-full text-sm border-collapse" style={{ pageBreakInside: 'auto' }}>
        <thead className="bg-slate-800 text-white" style={{ display: 'table-header-group' }}>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="py-2 px-3 border border-slate-700 text-center font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ display: 'table-row-group' }}>
          {data.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50"} style={{ pageBreakInside: 'avoid' }}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="py-2 px-3 border border-slate-200 text-slate-700">
                  {cell !== null && cell !== undefined ? String(cell) : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <PrintSignatureHtml 
        kotaPenandatangan={institutionInfo.kotaPenandatangan || "Bandung"}
        tanggalCetak={tanggalCetak}
        penandatanganKiri={penandatanganKiri}
        penandatanganKanan={penandatanganKanan}
        catatanKwitansi={institutionInfo.catatanKwitansi}
      />
    </div>
  )
}


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
    <div className="w-full mb-2">
      <div className="flex items-center mb-1.5">
        {/* Logo */}
        <div className="w-12 h-12 relative mr-3 flex-shrink-0">
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
              <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-800 mb-0.5">
                {institutionInfo.namaYayasan || "YAYASAN AL BASYARIAH"}
              </h2>
              <h1 className="text-[16px] font-black uppercase tracking-[0.1em] text-slate-900 mb-0.5 leading-tight">
                {institutionInfo.namaUnit}
              </h1>
            </>
          ) : (
            <h1 className="text-[16px] font-black uppercase tracking-[0.1em] text-slate-900 mb-0.5 leading-tight mt-1">
              {institutionInfo.namaYayasan || "YAYASAN AL BASYARIAH"}
            </h1>
          )}
          <p className="text-[9px] text-slate-700 max-w-2xl mx-auto leading-tight">
            {subtitle}
          </p>
        </div>
        
        {/* Balancer for centering (same width as logo + margin) */}
        <div className="w-12 ml-3 flex-shrink-0"></div>
      </div>
      
      {/* Double Border Line */}
      <div className="w-full border-b-[2px] border-slate-900 mb-[1px]"></div>
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
      <div className="flex flex-col items-center text-[10px] w-64">
        <p className="mb-0 h-3">{showDate ? `${kotaPenandatangan}, ${dateStr}` : ""}</p>
        <p className="mb-10">{signer.jabatan}</p>
        <p className="font-bold underline underline-offset-2">{signer.nama}</p>
      </div>
    )
  }

  return (
    <div className="mt-2 break-inside-avoid">
      <div className="flex justify-between items-start w-full px-8">
        {renderSigner(penandatanganKiri, false)}
        {renderSigner(penandatanganKanan, true)}
      </div>
      
      {/* Footer / Notes */}
      <div className="mt-2 pt-1 border-t border-slate-300 text-center text-[9px] text-slate-500 italic">
        <p>Dicetak melalui Sistem Informasi Siraya pada {new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</p>
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
    <div className="font-sans text-slate-900 bg-white flex flex-col">
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
          {data.slice(0, Math.max(0, data.length - 1)).map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50"} style={{ pageBreakInside: 'avoid' }}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="py-2 px-3 border border-slate-200 text-slate-700">
                  {cell !== null && cell !== undefined ? String(cell) : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot style={{ display: 'table-row-group' }}>
          {data.length > 0 && (
            <tr className={(data.length - 1) % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              {data[data.length - 1].map((cell, cIdx) => (
                <td key={cIdx} className="py-2 px-3 border border-slate-200 text-slate-700">
                  {cell !== null && cell !== undefined ? String(cell) : "-"}
                </td>
              ))}
            </tr>
          )}
        </tfoot>
      </table>

      <div className="mt-4 mb-2" style={{ pageBreakInside: 'avoid' }}>
        <PrintSignatureHtml 
          kotaPenandatangan={institutionInfo.kotaPenandatangan || "Bandung"}
          tanggalCetak={tanggalCetak}
          penandatanganKiri={penandatanganKiri}
          penandatanganKanan={penandatanganKanan}
          catatanKwitansi={institutionInfo.catatanKwitansi}
        />
      </div>
    </div>
  )
}


// ============================================================================
// 4. BUKTI PEMBAYARAN / KWITANSI (RESI)
// ============================================================================
export interface ResiPdfData {
  institutionInfo: PdfInstitutionInfo
  title?: string
  tanggal: string | Date
  noReferensi: string
  penerimaDari: string
  items: Array<{ keterangan: string, nominal: number, sisaTagihan?: number }>
  total: number
  penandatanganKiri?: { jabatan: string; nama: string }
  penandatanganKanan?: { jabatan: string; nama: string }
  catatan?: string
}

export function ResiHtml({
  institutionInfo,
  title,
  tanggal,
  noReferensi,
  penerimaDari,
  items,
  total,
  penandatanganKiri,
  penandatanganKanan,
  catatan
}: ResiPdfData) {
  const parsedDate = new Date(tanggal)
  const dateStr = !isNaN(parsedDate.getTime()) 
    ? parsedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : String(tanggal)

  const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

  return (
    <div className="font-sans text-slate-900 bg-white flex flex-col min-h-[130mm]">
      <PrintHeaderHtml institutionInfo={institutionInfo} />

      {/* Header Info: Judul dan Referensi */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1"></div>
        <div className="text-center flex-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-400 inline-block pb-0.5">
            {title || "BUKTI PEMBAYARAN / KWITANSI"}
          </h3>
        </div>
        <div className="flex-1 text-right text-[10px] text-slate-600 leading-tight">
          <p>Tanggal: {dateStr}</p>
          <p>No. Ref: <span className="font-semibold">{noReferensi}</span></p>
        </div>
      </div>

      {/* Identitas */}
      <div className="mb-2 text-[10px]">
        <table className="w-auto">
          <tbody>
            <tr>
              <td className="py-0.5 pr-4 text-slate-600">Telah terima dari</td>
              <td className="py-0.5 pr-2">:</td>
              <td className="py-0.5 font-bold text-slate-800">{penerimaDari}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tabel Item */}
      <table className="w-full text-[10px] border-collapse mb-1">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="py-1 px-1.5 border border-slate-700 text-center font-bold w-10">No</th>
            <th className="py-1 px-1.5 border border-slate-700 text-left font-bold">Keterangan Pembayaran</th>
            <th className="py-1 px-1.5 border border-slate-700 text-right font-bold w-32">Nominal</th>
          </tr>
        </thead>
        <tbody style={{ display: 'table-row-group' }}>
          {items.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              <td className="py-1.5 px-2 border border-slate-200 text-center text-slate-700 align-top">{i + 1}</td>
              <td className="py-1.5 px-2 border border-slate-200 text-slate-700 align-top">
                <div className="font-medium text-slate-800">{item.keterangan}</div>
                {item.sisaTagihan !== undefined && item.sisaTagihan > 0 && (
                  <div className="text-[9px] text-slate-500 mt-0.5 italic leading-tight">
                    * Pembayaran Sebagian. Sisa Tagihan: {formatRp(item.sisaTagihan)}
                  </div>
                )}
              </td>
              <td className="py-1.5 px-2 border border-slate-200 text-right text-slate-700 font-medium align-top">
                {formatRp(item.nominal)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot style={{ display: 'table-row-group' }}>
          {/* Baris Total */}
          <tr className="bg-slate-100">
            <td colSpan={2} className="py-1.5 px-1.5 border border-slate-300 text-right font-bold text-slate-800 uppercase">
              Total Pembayaran
            </td>
            <td className="py-1.5 px-1.5 border border-slate-300 text-right font-bold text-slate-900 text-xs">
              {formatRp(total)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-auto mb-0 pt-4" style={{ pageBreakInside: 'avoid' }}>
        <PrintSignatureHtml 
          kotaPenandatangan={institutionInfo.kotaPenandatangan || "Bandung"}
          tanggalCetak={tanggal}
          penandatanganKiri={penandatanganKiri || { jabatan: "Penyetor / Wali Murid,", nama: penerimaDari }}
          penandatanganKanan={penandatanganKanan || { jabatan: "Bendahara Penerima,", nama: "Staf Keuangan" }}
          catatanKwitansi={catatan || "Terima kasih atas pembayaran Anda. Simpan kwitansi ini sebagai bukti pembayaran yang sah."}
        />
      </div>
    </div>
  )
}

// ============================================================================
// 5. JURNAL UMUM
// ============================================================================
export interface JurnalPdfData {
  institutionInfo: PdfInstitutionInfo
  judulJurnal: string
  noReferensi: string
  tanggal: string | Date
  deskripsi: string
  detail: Array<{ kodeAkun: string, namaAkun: string, debit: number, kredit: number }>
  penandatanganKiri?: { jabatan: string; nama: string }
  penandatanganKanan?: { jabatan: string; nama: string }
}

export function JurnalHtml({
  institutionInfo,
  judulJurnal,
  noReferensi,
  tanggal,
  deskripsi,
  detail,
  penandatanganKiri,
  penandatanganKanan
}: JurnalPdfData) {
  const parsedDate = new Date(tanggal)
  const dateStr = !isNaN(parsedDate.getTime()) 
    ? parsedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : String(tanggal)
    
  const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

  return (
    <div className="font-sans text-slate-900 bg-white">
      <PrintHeaderHtml institutionInfo={institutionInfo} />

      <div className="text-center mb-6">
        <h3 className="text-lg font-bold uppercase tracking-wider text-slate-800">{judulJurnal}</h3>
      </div>

      <div className="mb-6 text-sm text-slate-700">
        <table className="w-auto">
          <tbody>
            <tr><td className="py-1 pr-4">No Referensi</td><td className="py-1 pr-2">:</td><td className="py-1 font-semibold text-slate-900">{noReferensi}</td></tr>
            <tr><td className="py-1 pr-4">Tanggal</td><td className="py-1 pr-2">:</td><td className="py-1 font-semibold text-slate-900">{dateStr}</td></tr>
            <tr><td className="py-1 pr-4">Deskripsi</td><td className="py-1 pr-2">:</td><td className="py-1 font-semibold text-slate-900">{deskripsi || "-"}</td></tr>
          </tbody>
        </table>
      </div>

      <table className="w-full text-sm border-collapse mb-2">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="py-2 px-3 border border-slate-700 text-left font-bold w-32">Kode Akun</th>
            <th className="py-2 px-3 border border-slate-700 text-left font-bold">Nama Akun</th>
            <th className="py-2 px-3 border border-slate-700 text-right font-bold w-40">Debit</th>
            <th className="py-2 px-3 border border-slate-700 text-right font-bold w-40">Kredit</th>
          </tr>
        </thead>
        <tbody style={{ display: 'table-row-group' }}>
          {detail.map((d, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              <td className="py-2 px-3 border border-slate-200 text-slate-700">{d.kodeAkun}</td>
              <td className="py-2 px-3 border border-slate-200 text-slate-700">{d.namaAkun}</td>
              <td className="py-2 px-3 border border-slate-200 text-right text-slate-700">{d.debit > 0 ? formatRp(d.debit) : "-"}</td>
              <td className="py-2 px-3 border border-slate-200 text-right text-slate-700">{d.kredit > 0 ? formatRp(d.kredit) : "-"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot style={{ display: 'table-row-group' }}>
          {/* Baris Total */}
          <tr className="bg-slate-100">
            <td colSpan={2} className="py-3 px-3 border border-slate-300 text-right font-bold text-slate-800 uppercase">
              Total
            </td>
            <td className="py-3 px-3 border border-slate-300 text-right font-bold text-slate-900">
              {formatRp(detail.reduce((sum, d) => sum + d.debit, 0))}
            </td>
            <td className="py-3 px-3 border border-slate-300 text-right font-bold text-slate-900">
              {formatRp(detail.reduce((sum, d) => sum + d.kredit, 0))}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 mb-2" style={{ pageBreakInside: 'avoid' }}>
        <PrintSignatureHtml 
          kotaPenandatangan={institutionInfo.kotaPenandatangan || "Bandung"}
          tanggalCetak={tanggal}
          penandatanganKiri={penandatanganKiri || { jabatan: "Dibuat Oleh,", nama: "........................" }}
          penandatanganKanan={penandatanganKanan || { jabatan: "Disetujui Oleh,", nama: "........................" }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// 6. LAPORAN PEMASUKAN DAN PENGELUARAN (INCOME STATEMENT)
// ============================================================================
export interface IncomeStatementPdfData {
  institutionInfo: PdfInstitutionInfo
  startDate: string
  endDate: string
  data: {
    pendapatan: Array<{ kode: string, nama: string, total: number }>
    pengeluaran: Array<{ kode: string, nama: string, total: number }>
    totalPendapatan: number
    totalPengeluaran: number
  }
  tanggalCetak?: string | Date
  penandatanganKiri?: { jabatan: string; nama: string }
  penandatanganKanan?: { jabatan: string; nama: string }
}

export function IncomeStatementHtml({
  institutionInfo,
  startDate,
  endDate,
  data,
  tanggalCetak = new Date(),
  penandatanganKiri,
  penandatanganKanan
}: IncomeStatementPdfData) {
  const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val)

  return (
    <div className="font-sans text-slate-900 bg-white">
      <PrintHeaderHtml institutionInfo={institutionInfo} />

      <div className="text-center mb-8">
        <h3 className="text-lg font-bold uppercase tracking-wider text-slate-800">LAPORAN PEMASUKAN DAN PENGELUARAN</h3>
        <p className="text-sm text-slate-500 mt-1">Periode: {startDate} - {endDate}</p>
      </div>

      <table className="w-full text-sm border-collapse mb-2">
        <thead>
          <tr>
            <th colSpan={2} className="py-2 px-2 border-b-2 border-slate-800 text-left font-bold text-slate-600 w-3/4">Keterangan</th>
            <th colSpan={2} className="py-2 px-2 border-b-2 border-slate-800 text-right font-bold text-slate-800 w-1/4">SALDO</th>
          </tr>
        </thead>
        <tbody>
          {/* PENDAPATAN */}
          <tr>
            <td colSpan={4} className="py-2 px-2 font-bold text-[11px] text-emerald-600 uppercase tracking-widest pt-4">
              PEMASUKAN
            </td>
          </tr>
          {data.pendapatan.length === 0 ? (
            <tr><td colSpan={4} className="py-2 px-2 pl-6 italic text-slate-400">Tidak ada data pendapatan</td></tr>
          ) : (
            data.pendapatan.map((p, i) => (
              <tr key={i}>
                <td className="py-1.5 px-2 pl-6 text-slate-800 w-24 align-top">{p.kode}</td>
                <td className="py-1.5 px-2 text-slate-600 align-top">{p.nama}</td>
                <td className="py-1.5 px-2 text-slate-600 text-right align-top w-8">Rp.</td>
                <td className="py-1.5 px-2 text-slate-600 text-right align-top w-32">{formatRp(p.total)}</td>
              </tr>
            ))
          )}
          <tr className="border-t border-slate-200">
            <td colSpan={2} className="py-2 px-2 font-bold text-emerald-600 text-right">Total PENDAPATAN</td>
            <td className="py-2 px-2 font-bold text-emerald-600 text-right w-8">Rp.</td>
            <td className="py-2 px-2 font-bold text-emerald-600 text-right">{formatRp(data.totalPendapatan)}</td>
          </tr>

          {/* Spacer */}
          <tr><td colSpan={4} className="py-4"></td></tr>

          {/* PENGELUARAN */}
          <tr className="border-t border-slate-300">
            <td colSpan={2} className="py-2 px-2 font-bold text-slate-800">BIAYA BEBAN</td>
            <td className="py-2 px-2 font-bold text-slate-800 text-right w-8">Rp.</td>
            <td className="py-2 px-2 font-bold text-slate-800 text-right">{formatRp(data.totalPengeluaran)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="py-2 px-2 font-bold text-[11px] text-rose-600 uppercase tracking-widest pt-4">
              PENGELUARAN
            </td>
          </tr>
          {data.pengeluaran.length === 0 ? (
            <tr><td colSpan={4} className="py-2 px-2 pl-6 italic text-slate-400">Tidak ada data pengeluaran</td></tr>
          ) : (
            data.pengeluaran.map((p, i) => (
              <tr key={i}>
                <td className="py-1.5 px-2 pl-6 text-slate-800 w-24 align-top">{p.kode}</td>
                <td className="py-1.5 px-2 text-slate-600 align-top">{p.nama}</td>
                <td className="py-1.5 px-2 text-slate-600 text-right align-top w-8">Rp.</td>
                <td className="py-1.5 px-2 text-slate-600 text-right align-top w-32">{formatRp(p.total)}</td>
              </tr>
            ))
          )}
          <tr className="border-t border-slate-200">
            <td colSpan={2} className="py-2 px-2 font-bold text-rose-600 text-right">Total PENGELUARAN</td>
            <td className="py-2 px-2 font-bold text-rose-600 text-right w-8">Rp.</td>
            <td className="py-2 px-2 font-bold text-rose-600 text-right">{formatRp(data.totalPengeluaran)}</td>
          </tr>

          {/* Spacer */}
          <tr><td colSpan={4} className="py-4"></td></tr>

          {/* SALDO BERSIH */}
        </tbody>
        <tfoot style={{ display: 'table-row-group' }}>
          <tr className="border-t-2 border-slate-800">
            <td colSpan={2} className="py-3 px-2 font-bold text-slate-900 uppercase">Selisih Pemasukan dan Pengeluaran</td>
            <td className="py-3 px-2 font-bold text-slate-900 text-right w-8 text-base">Rp.</td>
            <td className="py-3 px-2 font-bold text-slate-900 text-right text-base">{formatRp(data.totalPendapatan - data.totalPengeluaran)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 mb-2" style={{ pageBreakInside: 'avoid' }}>
        <PrintSignatureHtml 
          kotaPenandatangan={institutionInfo.kotaPenandatangan || "Bandung"}
          tanggalCetak={tanggalCetak}
          penandatanganKiri={penandatanganKiri}
          penandatanganKanan={penandatanganKanan}
        />
      </div>
    </div>
  )
}

export function MutasiBankHtml({ data, institutionInfo, dateRangeStr, accountName, penandatanganKiri, penandatanganKanan }: { data: any, institutionInfo: any, dateRangeStr: string, accountName: string, penandatanganKiri?: any, penandatanganKanan?: any }) {
  const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalDebit = data.mutasi.reduce((acc: number, curr: any) => acc + curr.debit, 0)
  const totalKredit = data.mutasi.reduce((acc: number, curr: any) => acc + curr.kredit, 0)
  const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val)

  return (
    <div className="bg-white text-[11px] leading-relaxed text-slate-800" style={{ fontFamily: 'Arial, sans-serif' }}>
      <PrintHeaderHtml institutionInfo={institutionInfo} />
      
      <div className="text-center mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">MUTASI {accountName.toUpperCase()}</h3>
        <p className="text-[10px] text-slate-500 mt-1">Periode: {dateRangeStr}</p>
      </div>

      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-800 bg-slate-50 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
            <th className="py-2 px-2 text-left w-20">Tanggal</th>
            <th className="py-2 px-2 text-left w-24">No. Ref</th>
            <th className="py-2 px-2 text-left">Keterangan</th>
            <th className="py-2 px-2 text-right w-24">Debit (Masuk)</th>
            <th className="py-2 px-2 text-right w-24">Kredit (Keluar)</th>
            <th className="py-2 px-2 text-right w-24">Saldo</th>
          </tr>
        </thead>
        <tbody className="text-[11px]">
          <tr className="border-b border-slate-200 bg-slate-50/50">
            <td colSpan={5} className="py-2 px-2 text-right font-semibold text-slate-600">Saldo Awal:</td>
            <td className="py-2 px-2 text-right font-bold text-slate-800">Rp {formatRp(data.saldoAwal)}</td>
          </tr>
          
          {data.mutasi.map((m: any, i: number) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-1.5 px-2 text-slate-700">{new Date(m.tanggal).toLocaleDateString('id-ID')}</td>
              <td className="py-1.5 px-2 font-mono text-[9px] text-slate-500">{m.noReferensi}</td>
              <td className="py-1.5 px-2 text-slate-700">
                {m.keterangan}
                {m.pihakKetiga !== "-" && <div className="text-[9px] text-emerald-600 mt-0.5">Mitra/Siswa: {m.pihakKetiga}</div>}
              </td>
              <td className="py-1.5 px-2 text-right text-emerald-700">{m.debit > 0 ? `Rp ${formatRp(m.debit)}` : "-"}</td>
              <td className="py-1.5 px-2 text-right text-rose-700">{m.kredit > 0 ? `Rp ${formatRp(m.kredit)}` : "-"}</td>
              <td className="py-1.5 px-2 text-right font-medium text-slate-800">Rp {formatRp(m.saldo)}</td>
            </tr>
          ))}

          {data.mutasi.length === 0 && (
            <tr><td colSpan={6} className="py-6 px-2 text-center text-slate-500 italic">Tidak ada mutasi pada periode ini</td></tr>
          )}
        </tbody>
        <tfoot style={{ display: 'table-row-group' }}>
          <tr className="border-t-2 border-slate-800 bg-slate-50 font-bold">
            <td colSpan={3} className="py-2 px-2 text-right text-slate-800">Total Mutasi & Saldo Akhir:</td>
            <td className="py-2 px-2 text-right text-emerald-700">Rp {formatRp(totalDebit)}</td>
            <td className="py-2 px-2 text-right text-rose-700">Rp {formatRp(totalKredit)}</td>
            <td className="py-2 px-2 text-right text-blue-800">Rp {formatRp(data.saldoAkhir)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 mb-2" style={{ pageBreakInside: 'avoid' }}>
        <PrintSignatureHtml 
          kotaPenandatangan={institutionInfo.kotaPenandatangan || "Bandung"}
          tanggalCetak={tanggalCetak}
          penandatanganKiri={penandatanganKiri}
          penandatanganKanan={penandatanganKanan}
        />
      </div>
    </div>
  )
}

// ============================================================================
// 7. KOMPONEN LAPORAN TUNGGAKAN MATRIKS
// ============================================================================
export interface TunggakanMatriksHtmlProps {
  institutionInfo: PdfInstitutionInfo
  title: string
  subtitle: string
  data: any[]
  dynamicCategories: string[]
  tanggalCetak: string | Date
  penandatanganKiri?: { jabatan: string; nama: string }
  penandatanganKanan?: { jabatan: string; nama: string }
  config?: any
}

export function TunggakanMatriksHtml({
  institutionInfo,
  title,
  subtitle,
  data,
  dynamicCategories,
  tanggalCetak,
  penandatanganKiri,
  penandatanganKanan
}: TunggakanMatriksHtmlProps) {
  const formatRp = (val: number) => new Intl.NumberFormat('id-ID').format(val || 0)

  return (
    <div className="font-sans text-slate-900 bg-white min-h-screen">
      <PrintHeaderHtml institutionInfo={institutionInfo} />

      <div className="text-center mb-4 mt-2">
        <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
        <p className="text-[10px] text-slate-600 font-medium">{subtitle}</p>
      </div>

      <table className="w-full text-left text-[9px] border-collapse mt-2">
        <thead>
          <tr className="bg-slate-100 border-y border-slate-400">
            <th className="py-2 px-2 text-center font-bold border-x border-slate-300" rowSpan={2}>NO</th>
            <th className="py-2 px-2 font-bold border-x border-slate-300" rowSpan={2}>NIS</th>
            <th className="py-2 px-2 font-bold border-x border-slate-300" rowSpan={2}>NAMA SISWA</th>
            <th className="py-2 px-2 font-bold border-x border-slate-300" rowSpan={2}>ROMBEL</th>
            <th className="py-1 px-2 text-center font-bold border-x border-slate-300" colSpan={3}>SPP</th>
            {dynamicCategories.length > 0 && (
              <th className="py-1 px-2 text-center font-bold border-x border-slate-300" colSpan={dynamicCategories.length}>TAGIHAN LAINNYA</th>
            )}
            <th className="py-2 px-2 text-right font-bold border-x border-slate-300" rowSpan={2}>TOTAL</th>
          </tr>
          <tr className="bg-slate-50 border-b border-slate-400">
            <th className="py-1 px-2 text-center font-medium border-x border-slate-300">Bulan</th>
            <th className="py-1 px-2 text-center font-medium border-x border-slate-300">Jml</th>
            <th className="py-1 px-2 text-right font-medium border-x border-slate-300">Nilai SPP</th>
            {dynamicCategories.map(cat => (
              <th key={cat} className="py-1 px-2 text-right font-medium border-x border-slate-300">{cat}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50">
              <td className="py-1.5 px-2 text-center border-x border-slate-200">{idx + 1}</td>
              <td className="py-1.5 px-2 font-mono text-[8px] border-x border-slate-200">{item.nis}</td>
              <td className="py-1.5 px-2 font-semibold border-x border-slate-200">{item.namaSiswa}</td>
              <td className="py-1.5 px-2 border-x border-slate-200">{item.rombel}</td>
              <td className="py-1.5 px-2 text-center border-x border-slate-200 truncate max-w-[80px]" title={item.sppMonthString}>{item.sppMonthString}</td>
              <td className="py-1.5 px-2 text-center border-x border-slate-200">{item.sppCount || "-"}</td>
              <td className="py-1.5 px-2 text-right border-x border-slate-200">{item.sppAmount ? formatRp(item.sppAmount) : "-"}</td>
              {dynamicCategories.map(cat => (
                <td key={cat} className="py-1.5 px-2 text-right border-x border-slate-200">
                  {item.categories[cat] ? formatRp(item.categories[cat]) : "-"}
                </td>
              ))}
              <td className="py-1.5 px-2 text-right font-bold border-x border-slate-200">{formatRp(item.totalTunggakan)}</td>
            </tr>
          ))}
          {/* Totals Row */}
          <tr className="bg-slate-100 border-y border-slate-400 font-bold">
            <td colSpan={4} className="py-2 px-2 text-right border-x border-slate-300">TOTAL KESELURUHAN</td>
            <td colSpan={2} className="border-x border-slate-300"></td>
            <td className="py-2 px-2 text-right border-x border-slate-300">{formatRp(data.reduce((acc, curr) => acc + curr.sppAmount, 0))}</td>
            {dynamicCategories.map(cat => (
              <td key={cat} className="py-2 px-2 text-right border-x border-slate-300">
                {formatRp(data.reduce((acc, curr) => acc + (curr.categories[cat] || 0), 0))}
              </td>
            ))}
            <td className="py-2 px-2 text-right border-x border-slate-300">{formatRp(data.reduce((acc, curr) => acc + curr.totalTunggakan, 0))}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 mb-2" style={{ pageBreakInside: 'avoid' }}>
        <PrintSignatureHtml 
          kotaPenandatangan={institutionInfo.kotaPenandatangan || "Bandung"}
          tanggalCetak={tanggalCetak}
          penandatanganKiri={penandatanganKiri}
          penandatanganKanan={penandatanganKanan}
        />
      </div>
    </div>
  )
}

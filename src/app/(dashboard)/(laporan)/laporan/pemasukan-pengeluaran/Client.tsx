"use client"

import { useState, useEffect } from "react"
import { getLaporanPemasukanPengeluaran } from "@/actions/laporan"
import { Calendar as CalendarIcon, Share2, Printer, Search, RefreshCw, Download, ArrowLeft, FileText, FileSpreadsheet, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { exportToExcel } from "@/lib/excel"
import { exportIncomeStatementPdf } from "@/lib/pdf"
import { buildInstitutionInfo, getSignatoryKiri } from "@/lib/pdf-helpers"
import toast from "react-hot-toast"
import PrintHeader from "@/components/shared/print/PrintHeader"
import PrintSignature from "@/components/shared/print/PrintSignature"
import PrintFooter from "@/components/shared/print/PrintFooter"
import { PageHeader } from "@/components/ui/PageHeader"
import { ToolbarFilter, ToolbarRefreshButton, ToolbarExportExcel, ToolbarExportPDF, ToolbarPrintButton } from "@/components/ui/DataTableToolbar"

export default function LaporanPemasukanClient({ pengaturan, schoolUnits = [], userRole, userUnitId, userName }: { pengaturan?: any, schoolUnits?: any[], userRole?: string, userUnitId?: string, userName?: string }) {
  const router = useRouter()
  
  const filterUnitId = userUnitId || ""
  const unitName = filterUnitId ? (schoolUnits?.find(u => u.id === filterUnitId)?.name || "UNIT") : "YAYASAN"

  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<{
    pendapatan: any[],
    totalPendapatan: number,
    pengeluaran: any[],
    totalPengeluaran: number
  } | null>(null)

  // Default to current month
  const [dateRange, setDateRange] = useState("Bulan Ini")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  const formatPeriodDisplay = (start: string, end: string) => {
    if (!start || !end) return ""
    const parseDateSafe = (dStr: string) => {
      const parts = dStr.split('-')
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      }
      return new Date(dStr)
    }

    const dStart = parseDateSafe(start)
    const dEnd = parseDateSafe(end)
    const opt: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }

    if (start === end) {
      return `per ${dStart.toLocaleDateString("id-ID", opt)}`
    }
    return `per ${dStart.toLocaleDateString("id-ID", opt)} s/d ${dEnd.toLocaleDateString("id-ID", opt)}`
  }

  const getDates = (range: string) => {
    const today = new Date()
    let start = new Date()
    let end = new Date()

    if (range === "Hari Ini") {
      start = new Date(today)
      end = new Date(today)
    } else if (range === "Minggu Ini") {
      const d = new Date(today)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
      start = new Date(d.setDate(diff))
      end = new Date(d.setDate(start.getDate() + 6))
    } else if (range === "Bulan Ini") {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    } else if (range === "Tahun Ini") {
      start = new Date(today.getFullYear(), 0, 1)
      end = new Date(today.getFullYear(), 11, 31)
    } else if (range === "Kustom") {
      start = customStart ? new Date(customStart) : new Date()
      end = customEnd ? new Date(customEnd) : new Date()
    }

    // Format to YYYY-MM-DD
    const formatDate = (d: Date) => {
      const offset = d.getTimezoneOffset()
      const localDate = new Date(d.getTime() - (offset*60*1000))
      return localDate.toISOString().split('T')[0]
    }

    return { startDate: formatDate(start), endDate: formatDate(end) }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const { startDate, endDate } = getDates(dateRange)
      const res = await getLaporanPemasukanPengeluaran(startDate, endDate, filterUnitId)
      setData(res)
    } catch (error: any) {
      toast.error("Gagal mengambil data laporan: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dateRange, filterUnitId])

  const { startDate, endDate } = getDates(dateRange)

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    if (!data) return
    const isSingleDay = startDate === endDate
    const filename = isSingleDay
      ? `Laporan_Arus_Kas_${unitName.replace(/\s+/g, '_')}_${startDate}`
      : `Laporan_Arus_Kas_${unitName.replace(/\s+/g, '_')}_${startDate}_sd_${endDate}`
    
    // Flatten data for Excel
    const excelData: any[] = []
    
    data.pendapatan.forEach((p: any) => {
      excelData.push({
        Tipe: "Pendapatan",
        "Kode Akun": p.kode,
        "Nama Akun": p.nama,
        "Nominal (Rp)": p.total
      })
    })

    data.pengeluaran.forEach((p: any) => {
      excelData.push({
        Tipe: "Pengeluaran",
        "Kode Akun": p.kode,
        "Nama Akun": p.nama,
        "Nominal (Rp)": p.total
      })
    })

    // Add empty row
    excelData.push({})
    
    // Add totals
    excelData.push({
      Tipe: "TOTAL PENDAPATAN",
      "Nominal (Rp)": data.totalPendapatan
    })
    excelData.push({
      Tipe: "TOTAL PENGELUARAN",
      "Nominal (Rp)": data.totalPengeluaran
    })
    excelData.push({
      Tipe: "SALDO BERSIH",
      "Nominal (Rp)": data.totalPendapatan - data.totalPengeluaran
    })

    const unitObjForKop = filterUnitId ? schoolUnits.find(u => u.id === filterUnitId) : undefined
    exportToExcel(excelData, filename, {
      title: `Laporan Pemasukan & Pengeluaran (${formatPeriodDisplay(startDate, endDate)})`,
      unitInfo: unitObjForKop || { name: pengaturan?.namaYayasan || "Yayasan Siraya" }
    })
    toast.success("Excel berhasil diunduh")
  }

  const handleExportPdf = () => {
    if (!data) return
    
    const selectedUnit = filterUnitId ? schoolUnits.find(u => u.id === filterUnitId) : undefined
    const instInfo = buildInstitutionInfo(pengaturan, selectedUnit)
    const isSingleDay = startDate === endDate
    const filename = isSingleDay
      ? `Laporan_Pemasukan_Pengeluaran_${startDate}.pdf`
      : `Laporan_Pemasukan_Pengeluaran_${startDate}_sd_${endDate}.pdf`
    
    exportIncomeStatementPdf({
      institutionInfo: instInfo,
      startDate: startDate || "",
      endDate: endDate || "",
      data: data,
      filename,
      penandatanganKiri: getSignatoryKiri(pengaturan, selectedUnit),
      penandatanganKanan: { jabatan: "Bendahara,", nama: selectedUnit?.namaBendaharaUnit || pengaturan?.namaBendaharaYayasan || userName || "____________________" }
    })
    
    toast.success("PDF berhasil diunduh")
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      <PageHeader
        className="print:hidden"
        backHref="/laporan"
        backLabel="Kembali ke Menu Laporan"
        backShortLabel="Kembali"
        title="Pemasukan & Pengeluaran"
        subtitle="Laporan Laba/Rugi sekolah dalam rentang waktu tertentu"
        action={
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <ToolbarRefreshButton onClick={fetchData} disabled={isLoading} title="Segarkan Data" />
            <ToolbarExportExcel onClick={handleExportExcel} />
            <ToolbarExportPDF onClick={handleExportPdf} />
            <ToolbarPrintButton onClick={handlePrint} />
          </div>
        }
      />

      {/* Filter Card */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl shadow-sm border border-border mb-6">
        <div className="text-sm font-semibold text-text-muted mb-2.5">Filter Laporan</div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          <ToolbarFilter
            icon={<CalendarIcon size={14} />}
            value={dateRange}
            onChange={(val) => setDateRange(val)}
            className="w-full md:w-auto sm:max-w-none md:max-w-[200px]"
            options={[
              { label: "Hari ini", value: "Hari Ini" },
              { label: "Minggu ini", value: "Minggu Ini" },
              { label: "Bulan ini", value: "Bulan Ini" },
              { label: "Tahun ini", value: "Tahun Ini" },
              { label: "Kustom", value: "Kustom" }
            ]}
          />

          {dateRange === "Kustom" && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input 
                type="date" 
                value={customStart} 
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-bg border border-border rounded-xl px-3 py-2 text-sm w-full md:w-auto min-h-[44px] sm:min-h-[38px] short:min-h-[34px] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <span className="text-text-muted">-</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-bg border border-border rounded-xl px-3 py-2 text-sm w-full md:w-auto min-h-[44px] sm:min-h-[38px] short:min-h-[34px] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          )}

          <Button 
            variant="primary"
            size="sm"
            onClick={fetchData} 
            disabled={isLoading} 
            className="w-full md:w-auto justify-center min-h-[44px] sm:min-h-[38px] short:min-h-[34px] font-bold shadow-sm"
          >
            {isLoading ? <RefreshCw className="animate-spin mr-1.5" size={16} /> : <Search className="mr-1.5" size={16} />}
            Filter
          </Button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 print:hidden">
        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f32] border border-emerald-200/60 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Total Pemasukan</div>
            <div className="text-lg sm:text-xl font-bold text-text-main">
              Rp {new Intl.NumberFormat("id-ID").format(data?.totalPendapatan || 0)}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center justify-center shrink-0">
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Total Pengeluaran</div>
            <div className="text-lg sm:text-xl font-bold text-text-main">
              Rp {new Intl.NumberFormat("id-ID").format(data?.totalPengeluaran || 0)}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wider mb-0.5">Saldo Bersih (Laba/Rugi)</div>
            <div className="text-lg sm:text-xl font-black text-blue-800">
              Rp {new Intl.NumberFormat("id-ID").format((data?.totalPendapatan || 0) - (data?.totalPengeluaran || 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Document */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6 md:p-8 print:shadow-none print:border-none print:p-0">
        
        {/* KOP SURAT (Hanya Print) */}
        <PrintHeader 
          pengaturan={pengaturan}
          unitInfo={filterUnitId ? schoolUnits.find(u => u.id === filterUnitId) : undefined} 
        />

        {/* Document Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-widest mb-1">Data {unitName}</div>
          <h2 className="text-lg sm:text-xl font-bold text-blue-600 print:text-black uppercase mb-1">LAPORAN PEMASUKAN DAN PENGELUARAN</h2>
          <div className="text-xs sm:text-sm font-medium text-rose-500 print:text-gray-800">{formatPeriodDisplay(startDate, endDate)}</div>
        </div>

        {/* Column Header */}
        <div className="flex justify-between items-center pb-2 border-b-2 border-rose-500/20 mb-6 px-2 sm:px-4">
          <div className="text-xs sm:text-sm font-semibold text-text-muted">Semua Departemen</div>
          <div className="text-xs sm:text-sm font-bold text-rose-500 uppercase">Saldo</div>
        </div>

        {/* Content */}
        {isLoading && !data ? (
          <div className="py-20 flex justify-center">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
          </div>
        ) : data ? (
          <div className="space-y-8">
            
            {/* PENDAPATAN SECTION */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 font-bold text-blue-600 mb-3 px-3 sm:px-4 py-1.5 bg-blue-50/60 rounded-xl">
                <span className="uppercase tracking-wider text-xs sm:text-sm">PENDAPATAN</span>
                <span className="text-sm sm:text-base font-mono">Rp {new Intl.NumberFormat("id-ID").format(data.totalPendapatan)}</span>
              </div>
              
              <div className="pl-1 sm:pl-6 mb-2">
                <div className="font-semibold text-teal-600 text-xs sm:text-sm mb-3 px-2 sm:px-0">RINCIAN PENDAPATAN</div>
                
                {data.pendapatan.length === 0 ? (
                  <div className="text-sm text-text-muted italic py-2 px-2">Tidak ada data pendapatan pada rentang ini.</div>
                ) : (
                  <div className="space-y-1.5">
                    {data.pendapatan.map((item, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 text-xs sm:text-sm text-text-main hover:bg-blue-50/50 py-2 sm:py-1.5 px-3 sm:px-4 rounded-xl transition-colors border-b border-border/40 sm:border-none">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-blue-600 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded font-mono text-xs font-bold shrink-0">{item.kode}</span>
                          <span className="uppercase font-medium truncate">{item.nama}</span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 whitespace-nowrap pl-8 sm:pl-0 font-mono font-bold text-text-main">
                          <span className="text-text-muted text-[10px] font-sans sm:hidden">Total:</span>
                          <span>Rp {new Intl.NumberFormat("id-ID").format(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 font-bold text-emerald-600 mt-4 px-3 sm:px-4 pt-4 border-t border-border">
                <span className="text-xs sm:text-sm">Total PENDAPATAN</span>
                <span className="text-sm sm:text-base font-mono">Rp {new Intl.NumberFormat("id-ID").format(data.totalPendapatan)}</span>
              </div>
            </div>

            {/* PENGELUARAN SECTION */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 font-bold text-blue-600 mb-3 px-3 sm:px-4 py-1.5 bg-blue-50/60 rounded-xl">
                <span className="uppercase tracking-wider text-xs sm:text-sm">BIAYA BEBAN</span>
                <span className="text-sm sm:text-base font-mono">Rp {new Intl.NumberFormat("id-ID").format(data.totalPengeluaran)}</span>
              </div>
              
              <div className="pl-1 sm:pl-6 mb-2">
                <div className="font-semibold text-teal-600 text-xs sm:text-sm mb-3 px-2 sm:px-0">RINCIAN PENGELUARAN</div>
                
                {data.pengeluaran.length === 0 ? (
                  <div className="text-sm text-text-muted italic py-2 px-2">Tidak ada data pengeluaran pada rentang ini.</div>
                ) : (
                  <div className="space-y-1.5">
                    {data.pengeluaran.map((item, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 text-xs sm:text-sm text-text-main hover:bg-blue-50/50 py-2 sm:py-1.5 px-3 sm:px-4 rounded-xl transition-colors border-b border-border/40 sm:border-none">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-blue-600 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded font-mono text-xs font-bold shrink-0">{item.kode}</span>
                          <span className="uppercase font-medium truncate">{item.nama}</span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 whitespace-nowrap pl-8 sm:pl-0 font-mono font-bold text-text-main">
                          <span className="text-text-muted text-[10px] font-sans sm:hidden">Total:</span>
                          <span>Rp {new Intl.NumberFormat("id-ID").format(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 font-bold text-rose-600 mt-4 px-3 sm:px-4 pt-4 border-t border-border">
                <span className="text-xs sm:text-sm">Total BIAYA BEBAN</span>
                <span className="text-sm sm:text-base font-mono">Rp {new Intl.NumberFormat("id-ID").format(data.totalPengeluaran)}</span>
              </div>
            </div>

            {/* SUMMARY SECTION */}
            <div className="pt-6 border-t-2 border-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-base sm:text-lg font-bold text-blue-700 px-3 sm:px-4 py-2 bg-blue-50/60 rounded-xl">
                <span>LABA / (RUGI) BERSIH</span>
                <span className="font-mono text-lg sm:text-xl font-black">
                  Rp {new Intl.NumberFormat("id-ID").format(data.totalPendapatan - data.totalPengeluaran)}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm font-bold text-text-muted px-3 sm:px-4 pt-2">
                <span>Persentase Dana Terpakai</span>
                <span className="font-mono font-bold text-text-main">
                  {data.totalPendapatan > 0 
                    ? `${((data.totalPengeluaran / data.totalPendapatan) * 100).toFixed(2)}%`
                    : "0.00%"}
                </span>
              </div>
            </div>

          </div>
        ) : null}

        {/* Tanda Tangan (Hanya Print) */}
        {data && (
          <PrintSignature
            pengaturan={pengaturan}
            unitInfo={filterUnitId ? schoolUnits.find(u => u.id === filterUnitId) : undefined}
            tipe="ganda"
            tanggal={new Date()}
            kiri={getSignatoryKiri(pengaturan, filterUnitId ? schoolUnits.find(u => u.id === filterUnitId) : undefined)}
            kanan={{ jabatan: "Bendahara,", nama: (filterUnitId ? schoolUnits.find(u => u.id === filterUnitId)?.namaBendaharaUnit : undefined) || pengaturan?.namaBendaharaYayasan || userName || "____________________" }}
          />
        )}
        
        <PrintFooter pengaturan={pengaturan} />

      </div>
    </div>
  )
}

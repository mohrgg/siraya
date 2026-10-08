"use client"

import { useState, useEffect, useMemo } from "react"
import { getLaporanTunggakanSiswa } from "@/actions/laporan"
import { ArrowLeft, Search, Download, Printer, RefreshCw, FileText, FileSpreadsheet, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { exportToExcel } from "@/lib/excel"
import { exportTunggakanMatriksPdf } from "@/lib/pdf"
import { buildInstitutionInfo, getSignatoryKiri } from "@/lib/pdf-helpers"
import { Input } from "@/components/ui/Input"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import PrintHeader from "@/components/shared/print/PrintHeader"
import PrintSignature from "@/components/shared/print/PrintSignature"
import PrintFooter from "@/components/shared/print/PrintFooter"
import { PageHeader } from "@/components/ui/PageHeader"
import { 
  Toolbar,
  ToolbarRefreshButton,
  ToolbarExportExcel, 
  ToolbarExportPDF, 
  ToolbarPrintButton,
  ToolbarFilter,
  ToolbarSearch
} from "@/components/ui/DataTableToolbar"
import { PaginationControls } from "@/components/ui/PaginationControls"
import { formatAcademicMonthSpans, MonthSpanResult } from "@/lib/academic-months"

export default function LaporanTunggakanClient({ pengaturan, schoolUnits = [], grades = [], classrooms = [], userRole, userUnitId, userName }: { pengaturan?: any, schoolUnits?: any[], grades?: any[], classrooms?: any[], userRole?: string, userUnitId?: string, userName?: string }) {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const filterUnitId = userUnitId || ""
  const activeUnit = filterUnitId ? schoolUnits?.find(u => u.id === filterUnitId) : undefined
  const unitName = activeUnit ? activeUnit.name : (userRole === "SUPERADMIN" ? "Semua Unit" : "YAYASAN")

  const [filterTingkatId, setFilterTingkatId] = useState("")
  const [filterSubKelasId, setFilterSubKelasId] = useState("")
  const [pageSize, setPageSize] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await getLaporanTunggakanSiswa(
        filterUnitId || undefined,
        filterTingkatId || undefined,
        filterSubKelasId || undefined
      )
      setData(res)
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat laporan tunggakan")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterUnitId])

  // Filtered and flattened matrix preparation
  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    const lower = searchTerm.toLowerCase()
    return data.filter(item => 
      (item.namaSiswa || "").toLowerCase().includes(lower) ||
      (item.nis || "").toLowerCase().includes(lower) ||
      (item.deskripsiTagihan || "").toLowerCase().includes(lower) ||
      (item.rombel || "").toLowerCase().includes(lower)
    )
  }, [data, searchTerm])

  const { rows: matrixRows, categories: dynamicCategories } = useMemo(() => {
    const studentMap = new Map<string, any>()
    const categorySet = new Set<string>()

    filteredData.forEach(item => {
      if (!studentMap.has(item.muridId)) {
        studentMap.set(item.muridId, {
          muridId: item.muridId,
          nis: item.nis || "-",
          namaSiswa: item.namaSiswa,
          rombel: item.rombel,
          sppMonths: [] as string[],
          sppAmount: 0,
          sppDibayar: 0,
          categories: {} as Record<string, { sisa: number, dibayar: number }>,
          totalTunggakan: 0
        })
      }

      const student = studentMap.get(item.muridId)
      
      if (item.isSPP) {
        if (item.sisa > 0) {
          const monthText = item.deskripsiTagihan || item.kategori || ""
          student.sppMonths.push(monthText)
        }
        student.sppAmount += item.sisa
        student.sppDibayar += item.dibayar
        student.totalTunggakan += item.sisa
      } else {
        const kat = item.kategori || "Lainnya"
        categorySet.add(kat)
        if (!student.categories[kat]) student.categories[kat] = { sisa: 0, dibayar: 0 }
        student.categories[kat].sisa += item.sisa
        student.categories[kat].dibayar += item.dibayar
        student.totalTunggakan += item.sisa
      }
    })

    const categories = Array.from(categorySet).sort()

    const rows = Array.from(studentMap.values())
      .filter(s => s.totalTunggakan > 0)
      .map(s => {
        const sppSpan: MonthSpanResult = formatAcademicMonthSpans(s.sppMonths)
        return {
          ...s,
          sppSpan,
          sppMonthString: sppSpan.displayShort,
          sppDisplayFull: sppSpan.displayFull,
          sppCount: sppSpan.count
        }
      })
      .sort((a, b) => (a.namaSiswa || "").localeCompare(b.namaSiswa || "", "id", { sensitivity: "base" }))

    return { rows, categories }
  }, [filteredData])

  const totalPages = Math.ceil(matrixRows.length / pageSize)
  const paginatedData = matrixRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    if (matrixRows.length === 0) return
    const filename = `Laporan_Tunggakan_${unitName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
    
    const excelData = matrixRows.map((item, idx) => {
      const row: any = {
        "No": idx + 1,
        "NIS": item.nis,
        "Nama Siswa": item.namaSiswa,
        "Rombel": item.rombel,
        "Bulan (SPP)": item.sppDisplayFull && item.sppDisplayFull !== "-" ? item.sppDisplayFull : item.sppMonthString,
        "Jml Bln": item.sppCount,
        "Nilai SPP": item.sppAmount,
      }
      dynamicCategories.forEach(cat => {
        const detail = item.categories[cat] || { sisa: 0, dibayar: 0 }
        row[cat] = detail.sisa > 0 ? detail.sisa : (detail.dibayar > 0 ? "LUNAS" : 0)
      })
      row["Total Tunggakan"] = item.totalTunggakan
      return row
    })

    const unitObjForKop = filterUnitId ? schoolUnits.find(u => u.id === filterUnitId) : undefined
    exportToExcel(excelData, filename, {
      title: "Laporan Tunggakan Siswa (Matriks)",
      unitInfo: unitObjForKop || { name: pengaturan?.namaYayasan || "Yayasan Siraya" }
    })
    toast.success("Excel berhasil diunduh")
  }

  const handleExportPdf = () => {
    if (matrixRows.length === 0) return
    
    const filename = `Laporan_Tunggakan_${unitName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`

    exportTunggakanMatriksPdf({
      institutionInfo: buildInstitutionInfo(pengaturan, activeUnit),
      title: "LAPORAN TUNGGAKAN SISWA",
      subtitle: `Per Tanggal: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      data: matrixRows,
      dynamicCategories,
      filename,
      tanggalCetak: new Date(),
      penandatanganKiri: getSignatoryKiri(pengaturan, activeUnit),
      penandatanganKanan: { jabatan: "Petugas Tata Usaha,", nama: activeUnit?.namaKepalaTU || userName || "____________________" }
    })
    
    toast.success("Memproses PDF...")
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      <PageHeader
        className="print:hidden"
        backHref="/laporan"
        backLabel="Kembali ke Menu Laporan"
        backShortLabel="Kembali"
        title="Laporan Tunggakan Siswa"
        subtitle="Menampilkan daftar rincian sisa tunggakan per murid"
        action={
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <ToolbarRefreshButton 
              onClick={fetchData} 
              disabled={isLoading}
              title="Segarkan Data"
            />
            <ToolbarExportExcel 
              onClick={handleExportExcel}
              disabled={matrixRows.length === 0}
            />
            <ToolbarExportPDF 
              onClick={handleExportPdf}
              disabled={matrixRows.length === 0}
            />
            <ToolbarPrintButton 
              onClick={handlePrint}
              disabled={matrixRows.length === 0}
            />
          </div>
        }
      />

      {/* Filter Card */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl shadow-sm border border-border mb-6">
        <div className="text-sm font-semibold text-text-muted mb-2">Filter Laporan</div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4">
          <ToolbarFilter
            value={filterTingkatId}
            onChange={(val) => { setFilterTingkatId(val); setFilterSubKelasId("") }}
            className="w-full md:w-auto sm:max-w-none md:max-w-[180px]"
            options={[
              { label: "Semua Tingkat", value: "" },
              ...grades.filter((g: any) => !filterUnitId || g.unitSekolahId === filterUnitId).map((g: any) => ({
                label: g.name,
                value: g.id
              }))
            ]}
          />

          <ToolbarFilter
            value={filterSubKelasId}
            onChange={(val) => setFilterSubKelasId(val)}
            className="w-full md:w-auto sm:max-w-none md:max-w-[180px]"
            options={[
              { label: "Semua Rombel", value: "" },
              ...classrooms.filter((c: any) => 
                (!filterUnitId || c.unitSekolahId === filterUnitId) &&
                (!filterTingkatId || c.tingkatId === filterTingkatId)
              ).map((c: any) => ({
                label: c.name,
                value: c.id
              }))
            ]}
          />

          <Button 
            variant="primary"
            size="sm"
            onClick={fetchData} 
            disabled={isLoading} 
            className="w-full md:w-auto gap-2 whitespace-nowrap min-h-[44px] sm:min-h-[38px] short:min-h-[34px] font-bold"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            Terapkan Filter
          </Button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 print:hidden">
        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Total Tagihan</div>
            <div className="text-lg sm:text-xl font-bold text-text-main">
              Rp {new Intl.NumberFormat("id-ID").format(filteredData.reduce((acc, curr) => acc + curr.nominal, 0))}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f32] border border-emerald-200/60 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Total Dibayar</div>
            <div className="text-lg sm:text-xl font-bold text-text-main">
              Rp {new Intl.NumberFormat("id-ID").format(filteredData.reduce((acc, curr) => acc + curr.dibayar, 0))}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center justify-center shrink-0">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-rose-700 uppercase tracking-wider mb-0.5">Sisa Tunggakan</div>
            <div className="text-lg sm:text-xl font-black text-rose-800">
              Rp {new Intl.NumberFormat("id-ID").format(matrixRows.reduce((acc, curr) => acc + curr.totalTunggakan, 0))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6 print:shadow-none print:border-none print:p-0">
        
        {/* KOP SURAT (Hanya Print) */}
        <PrintHeader 
          pengaturan={pengaturan}
          unitInfo={filterUnitId ? schoolUnits.find(u => u.id === filterUnitId) : undefined} 
        />

        {/* Document Header untuk Print */}
        <div className="hidden print:block text-center mb-6">
          <h2 className="text-xl font-bold text-black uppercase mb-1">LAPORAN TUNGGAKAN SISWA</h2>
          <div className="text-sm font-medium text-gray-800">Data {unitName}</div>
        </div>

        <Toolbar className="mb-6 print:hidden">
          <ToolbarSearch 
            placeholder="Cari nama, NIS, tagihan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
          />
        </Toolbar>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <>
            {/* VIEW A: MOBILE ADAPTIVE CARDS (<md) */}
            <div className="md:hidden divide-y divide-border border border-border rounded-2xl overflow-hidden mb-5">
              {paginatedData.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm italic">
                  Tidak ada data tunggakan.
                </div>
              ) : (
                paginatedData.map((item) => (
                  <div key={item.muridId} className="p-4 bg-surface flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-text-main truncate">{item.namaSiswa}</div>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                          <span className="font-mono">{item.nis}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">{item.rombel}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-rose-600 uppercase font-bold block">Tunggakan</span>
                        <span className="font-mono font-black text-rose-600 text-sm">
                          Rp {new Intl.NumberFormat("id-ID").format(item.totalTunggakan)}
                        </span>
                      </div>
                    </div>
                    
                    {/* SPP Breakdown */}
                    <div className="bg-bg p-2.5 rounded-xl border border-border flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-primary block">SPP ({item.sppCount || 0} Bln)</span>
                        <span className="text-[11px] text-text-muted break-words">{item.sppMonthString}</span>
                      </div>
                      <span className="font-mono font-bold text-primary shrink-0">
                        {item.sppAmount > 0 
                          ? `Rp ${new Intl.NumberFormat("id-ID").format(item.sppAmount)}` 
                          : <span className="text-emerald-600 font-bold">LUNAS</span>}
                      </span>
                    </div>

                    {/* Tagihan Lainnya jika ada */}
                    {dynamicCategories.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-border/50">
                        {dynamicCategories.map(cat => {
                          const detail = item.categories[cat] || { sisa: 0, dibayar: 0 }
                          if (detail.sisa <= 0 && detail.dibayar <= 0) return null
                          return (
                            <div key={cat} className="flex justify-between text-xs">
                              <span className="text-text-muted truncate mr-2">{cat}:</span>
                              <span className="font-mono font-medium shrink-0">
                                {detail.sisa > 0 ? `Rp ${new Intl.NumberFormat("id-ID").format(detail.sisa)}` : <span className="text-emerald-600 font-bold">LUNAS</span>}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* VIEW B: DESKTOP & PRINT MATRIX TABLE (>=md) */}
            <div className="hidden md:block print:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold text-center w-12 border-r border-border/50" rowSpan={2}>NO</th>
                    <th className="p-4 font-semibold border-r border-border/50" rowSpan={2}>NIS</th>
                    <th className="p-4 font-semibold border-r border-border/50 min-w-[200px]" rowSpan={2}>NAMA SISWA</th>
                    <th className="p-4 font-semibold border-r border-border/50" rowSpan={2}>ROMBEL</th>
                    <th className="p-4 font-semibold text-center border-r border-border/50 bg-primary/5 text-primary" colSpan={3}>SPP</th>
                    {dynamicCategories.length > 0 && (
                      <th className="p-4 font-semibold text-center border-r border-border/50" colSpan={dynamicCategories.length}>TAGIHAN LAINNYA</th>
                    )}
                    <th className="p-4 font-semibold text-right text-rose-600" rowSpan={2}>TOTAL TUNGGAKAN</th>
                  </tr>
                  <tr className="border-b border-border bg-bg/30 text-text-muted text-xs uppercase tracking-wider">
                    <th className="p-3 text-center font-medium border-r border-border/50 text-primary/80">Bulan</th>
                    <th className="p-3 text-center font-medium border-r border-border/50 text-primary/80">Jml Bln</th>
                    <th className="p-3 text-right font-medium border-r border-border/50 text-primary/80">Nilai SPP</th>
                    {dynamicCategories.map(cat => (
                      <th key={cat} className="p-3 text-right font-medium border-r border-border/50">{cat}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8 + dynamicCategories.length} className="p-8">
                        <div className="flex flex-col items-center justify-center text-center">
                          <BarChart3 size={40} className="text-gray-300 mb-3 stroke-[1.5]" />
                          <p className="font-bold text-text-main text-base mb-1">Belum ada data tunggakan</p>
                          <p className="text-xs text-text-muted max-w-sm">
                            Tidak ditemukan siswa dengan tagihan yang menunggak untuk kriteria filter ini.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                    {paginatedData.map((item, idx) => {
                      const absoluteIdx = (currentPage - 1) * pageSize + idx + 1
                      return (
                        <tr key={item.muridId} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                          <td className="p-4 text-center text-sm font-medium text-text-muted border-r border-border/50">{absoluteIdx}</td>
                          <td className="p-4 font-mono text-xs text-text-muted border-r border-border/50">{item.nis}</td>
                          <td className="p-4 text-sm font-bold text-text-main border-r border-border/50">{item.namaSiswa}</td>
                          <td className="p-4 text-xs font-medium text-text-muted border-r border-border/50">{item.rombel}</td>
                          <td className="p-4 text-center border-r border-border/50 relative group/tooltip">
                            {item.sppCount > 0 ? (
                              <div 
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100 transition-colors cursor-help"
                                title={item.sppDisplayFull}
                              >
                                <span>{item.sppMonthString}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                            {item.sppCount > 0 && item.sppSpan && (
                              <div className={`absolute left-1/2 -translate-x-1/2 ${
                                idx < 2 ? 'top-full mt-2' : 'bottom-full mb-2'
                              } opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 w-72 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700/80 whitespace-normal text-left pointer-events-none group-hover/tooltip:pointer-events-auto`}>
                                {/* Popover Header */}
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px]">
                                  <span className="font-bold text-slate-200">Status SPP (12 Bulan)</span>
                                  <span className="font-mono text-rose-400 font-semibold">{item.sppCount} Bln Menunggak</span>
                                </div>

                                {/* Semester 1 Ganjil */}
                                <div className="mb-2">
                                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex justify-between">
                                    <span>Semester Ganjil</span>
                                    <span className="text-slate-500 font-normal">Jul – Des</span>
                                  </div>
                                  <div className="grid grid-cols-6 gap-1">
                                    {item.sppSpan.allMonthsStatus.slice(0, 6).map((m: any) => (
                                      <div
                                        key={m.name}
                                        title={`${m.name}: ${m.isUnpaid ? 'Menunggak' : 'Lunas'}`}
                                        className={`py-1 text-center rounded text-[10px] font-bold font-mono transition-colors ${
                                          m.isUnpaid
                                            ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 ring-1 ring-rose-500/20'
                                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        }`}
                                      >
                                        {m.shortName}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Semester 2 Genap */}
                                <div>
                                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex justify-between">
                                    <span>Semester Genap</span>
                                    <span className="text-slate-500 font-normal">Jan – Jun</span>
                                  </div>
                                  <div className="grid grid-cols-6 gap-1">
                                    {item.sppSpan.allMonthsStatus.slice(6, 12).map((m: any) => (
                                      <div
                                        key={m.name}
                                        title={`${m.name}: ${m.isUnpaid ? 'Menunggak' : 'Lunas'}`}
                                        className={`py-1 text-center rounded text-[10px] font-bold font-mono transition-colors ${
                                          m.isUnpaid
                                            ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 ring-1 ring-rose-500/20'
                                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        }`}
                                      >
                                        {m.shortName}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Mini Legend & Full Text */}
                                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                                  <span className="truncate max-w-[130px] text-slate-400 font-normal" title={item.sppDisplayFull}>{item.sppDisplayFull}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="inline-flex items-center gap-1 text-emerald-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Lunas
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-rose-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Nunggak
                                    </span>
                                  </div>
                                </div>

                                {/* Arrow Pointer */}
                                {idx < 2 ? (
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-2.5 h-2.5 bg-slate-900 rotate-45 -mb-1.25 border-l border-t border-slate-700/80"></div>
                                ) : (
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1.25 border-r border-b border-slate-700/80"></div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center font-mono text-xs tabular-nums border-r border-border/50">{item.sppCount || "-"}</td>
                          <td className="p-4 text-right font-mono text-xs tabular-nums font-medium border-r border-border/50">
                            {item.sppAmount > 0 
                              ? <span className="text-primary">{new Intl.NumberFormat("id-ID").format(item.sppAmount)}</span>
                              : (item.sppDibayar > 0 ? <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Lunas</span> : "-")
                            }
                          </td>
                          
                          {dynamicCategories.map(cat => {
                            const detail = item.categories[cat] || { sisa: 0, dibayar: 0 }
                            return (
                              <td key={cat} className="p-4 text-right font-mono text-xs tabular-nums text-text-muted border-r border-border/50">
                                {detail.sisa > 0 
                                  ? new Intl.NumberFormat("id-ID").format(detail.sisa)
                                  : (detail.dibayar > 0 ? <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Lunas</span> : "-")
                                }
                              </td>
                            )
                          })}
                          
                          <td className="p-4 text-right font-mono text-xs leading-5 tabular-nums font-bold text-rose-600 bg-rose-50/30 group-hover:bg-rose-50/50">
                            {new Intl.NumberFormat("id-ID").format(item.totalTunggakan)}
                          </td>
                        </tr>
                      )
                    })}
                    {/* Totals Row */}
                    <tr className="bg-bg/50 border-t-2 border-border font-bold text-text-main">
                      <td colSpan={4} className="p-4 text-right border-r border-border/50 text-xs uppercase tracking-wider">TOTAL KESELURUHAN</td>
                      <td colSpan={2} className="border-r border-border/50"></td>
                      <td className="p-4 text-right text-primary tabular-nums text-xs border-r border-border/50">
                        {new Intl.NumberFormat("id-ID").format(matrixRows.reduce((acc, curr) => acc + curr.sppAmount, 0))}
                      </td>
                      {dynamicCategories.map(cat => (
                        <td key={`total-${cat}`} className="p-4 text-right tabular-nums text-xs border-r border-border/50">
                          {new Intl.NumberFormat("id-ID").format(matrixRows.reduce((acc, curr) => acc + (curr.categories[cat]?.sisa || 0), 0))}
                        </td>
                      ))}
                      <td className="p-4 text-right text-rose-700 tabular-nums text-xs">
                        Rp {new Intl.NumberFormat("id-ID").format(matrixRows.reduce((acc, curr) => acc + curr.totalTunggakan, 0))}
                      </td>
                    </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tanda Tangan (Hanya Print) */}
              <>
                <PrintSignature
                  pengaturan={pengaturan}
                  unitInfo={activeUnit}
                  tipe="ganda"
                  tanggal={new Date()}
                  kiri={getSignatoryKiri(pengaturan, activeUnit)}
                  kanan={{ jabatan: "Petugas Tata Usaha,", nama: activeUnit?.namaKepalaTU || userName || "____________________" }}
                />
                <PrintFooter pengaturan={pengaturan} />
              </>

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredData.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              className="print:hidden"
            />
          </>
        )}
      </div>

    </div>
  )
}

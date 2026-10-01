"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Plus, Printer, Download, RefreshCw, Eye, Edit, Trash2, Calendar as CalendarIcon, Filter, Receipt, ChevronDown, FileSpreadsheet, FileText, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { TabNavigation } from "@/components/ui/TabNavigation"
import { TableScrollHint } from "@/components/ui/TableScrollHint"
import { format, isToday, isThisWeek, isThisMonth, isWithinInterval, startOfDay, endOfDay, subMonths } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { hapusKasKeluar } from "@/actions/kas-keluar"
import toast from "react-hot-toast"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { 
  Toolbar, 
  ToolbarSearch, 
  ToolbarFilter, 
  ToolbarActions, 
  ToolbarExportExcel, 
  ToolbarExportPDF, 
  ToolbarAddButton, 
  ToolbarDivider,
  ToolbarRefreshButton
} from "@/components/ui/DataTableToolbar"
import { PageHeader } from "@/components/ui/PageHeader"
import { Layers } from "lucide-react"

type TransaksiWithRelations = any // Type will be inferred properly in real project

export interface KasKeluarItem {
  keterangan: string
  nominal: number
  akunId?: string
  akunKode?: string
  akunNama?: string
}

export function extractKasKeluarItems(item: any): KasKeluarItem[] {
  // Transaksi pembukuan umum kas keluar (berdasarkan baris DEBIT / beban)
  const debitDetails = item.detail ? item.detail.filter((d: any) => d.posisi === "DEBIT") : []
  if (debitDetails.length > 0) {
    return debitDetails.map((d: any) => ({
      keterangan: `${d.akun?.nama || ''} ${d.deskripsi ? `(${d.deskripsi})` : ''}`.trim() || item.deskripsi || "Pengeluaran",
      nominal: Number(d.nilai) || 0,
      akunId: d.akun?.id,
      akunKode: d.akun?.kode,
      akunNama: d.akun?.nama
    }))
  }

  // Fallback jika tidak memiliki detail
  return [
    {
      keterangan: item.deskripsi || "Pengeluaran Kas Keluar",
      nominal: Number(item.totalNilai) || 0
    }
  ]
}

export function filterKasKeluarItemMatches(it: KasKeluarItem, filterVal: string): boolean {
  if (!filterVal || filterVal === "ALL") return true
  if (filterVal.startsWith("CAT:")) {
    const cat = filterVal.replace("CAT:", "").toUpperCase()
    const targetText = `${it.keterangan} ${it.akunNama || ''}`.toUpperCase()
    if (cat === "GAJI") {
      return targetText.includes("GAJI") || targetText.includes("HONOR")
    }
    if (cat === "ATK") {
      return targetText.includes("ATK") || targetText.includes("ALAT TULIS")
    }
    if (cat === "UTILITAS") {
      return targetText.includes("LISTRIK") || targetText.includes("AIR") || targetText.includes("INTERNET") || targetText.includes("TELEPON")
    }
    return targetText.includes(cat)
  }
  if (filterVal.startsWith("AKUN:")) {
    const targetAkunId = filterVal.replace("AKUN:", "")
    return it.akunId === targetAkunId
  }
  return true
}

export function getVisibleItemsForKasKeluar(item: any, filterVal: string): KasKeluarItem[] {
  const allItems = extractKasKeluarItems(item)
  if (!filterVal || filterVal === "ALL") return allItems
  return allItems.filter(it => filterKasKeluarItemMatches(it, filterVal))
}

export default function KasKeluarClient({ 
  initialData, 
  userRole, 
  pengaturan, 
  schoolUnits = [], 
  userUnitId, 
  userName,
  opsiJenisPengeluaran = []
}: { 
  initialData: TransaksiWithRelations[], 
  userRole: string, 
  pengaturan?: any, 
  schoolUnits?: any[], 
  userUnitId?: string, 
  userName?: string,
  opsiJenisPengeluaran?: { label: string, value: string }[]
}) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedJenisPengeluaran, setSelectedJenisPengeluaran] = useState<string>("ALL")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const isReadOnly = userRole === "KEPALA_SEKOLAH" || userRole === "YAYASAN"
  
  const [filterBy, setFilterBy] = useState<'tanggal_transaksi' | 'tanggal_pembuatan'>('tanggal_transaksi')
  const [timeRange, setTimeRange] = useState<'semua' | 'hari' | 'minggu' | 'bulan' | 'bulan_lalu' | 'custom'>('hari')
  
  // Custom date state if needed
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleRefresh = () => {
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusKasKeluar(deleteId)
      toast.success("Transaksi Kas Keluar berhasil dihapus")
      setData(data.filter((item: any) => item.id !== deleteId))
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus transaksi")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredData = useMemo(() => {
    return data.filter((item: any) => {
      // 1. Filter Jenis Pengeluaran
      const visibleItems = getVisibleItemsForKasKeluar(item, selectedJenisPengeluaran)
      if (visibleItems.length === 0) return false

      // 2. Search Filter
      const matchesSearch = item.noReferensi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.namaPihakKetiga || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.deskripsi || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        visibleItems.some(it => it.keterangan.toLowerCase().includes(searchTerm.toLowerCase()))
      
      if (!matchesSearch) return false

      // 3. Date Filter
      if (timeRange === 'semua') {
        return true
      }
      const dateToFilter = filterBy === 'tanggal_pembuatan' ? new Date(item.createdAt) : new Date(item.tanggal)
      
      if (timeRange === 'hari') {
        return isToday(dateToFilter)
      } else if (timeRange === 'minggu') {
        return isThisWeek(dateToFilter, { weekStartsOn: 1 })
      } else if (timeRange === 'bulan') {
        return isThisMonth(dateToFilter)
      } else if (timeRange === 'bulan_lalu') {
        const lastMonth = subMonths(new Date(), 1)
        return dateToFilter.getMonth() === lastMonth.getMonth() && dateToFilter.getFullYear() === lastMonth.getFullYear()
      } else if (timeRange === 'custom' && startDate && endDate) {
        const start = startOfDay(new Date(startDate))
        const end = endOfDay(new Date(endDate))
        return isWithinInterval(dateToFilter, { start, end })
      }

      return true
    })
  }, [data, searchTerm, filterBy, timeRange, startDate, endDate, selectedJenisPengeluaran])

  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterBy, timeRange, startDate, endDate, selectedJenisPengeluaran])

  const paginatedData = useMemo(() => {
    return filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredData, currentPage, pageSize])

  const computedTotalPages = Math.ceil(filteredData.length / pageSize)

  const executiveMetrics = useMemo(() => {
    const totalKeluar = filteredData.reduce((sum: number, item: any) => {
      const items = getVisibleItemsForKasKeluar(item, selectedJenisPengeluaran)
      return sum + items.reduce((s, it) => s + it.nominal, 0)
    }, 0)
    const countTrans = filteredData.length
    const largeTrans = filteredData.filter((item: any) => {
      const items = getVisibleItemsForKasKeluar(item, selectedJenisPengeluaran)
      const transTotal = items.reduce((s, it) => s + it.nominal, 0)
      return transTotal >= 1000000
    }).length
    const avgTrans = countTrans > 0 ? Math.round(totalKeluar / countTrans) : 0
    return {
      totalKeluar,
      countTrans,
      largeTrans,
      avgTrans
    }
  }, [filteredData, selectedJenisPengeluaran])

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const { exportToExcel } = await import("@/lib/excel")
      const exportData: any[] = []
      let rowNum = 1
      filteredData.forEach((item: any) => {
        const items = getVisibleItemsForKasKeluar(item, selectedJenisPengeluaran)
        items.forEach((it, i) => {
          exportData.push({
            No: i === 0 ? rowNum : "",
            "Tgl Transaksi": i === 0 ? format(new Date(item.tanggal), "dd/MM/yyyy") : "",
            "Tgl Pembuatan": i === 0 ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm") : "",
            "No Referensi": i === 0 ? item.noReferensi : "",
            "No Formulir": i === 0 ? (item.noFormulir || "-") : "",
            "Penerima": i === 0 ? (item.penerima?.name || item.namaPihakKetiga || "-") : "",
            "Deskripsi": it.keterangan,
            "Total Nilai": it.nominal,
            "Pembuat": i === 0 ? (item.pembuat?.name || "-") : "",
            "Status": i === 0 ? item.status : "",
            "Revisi": i === 0 ? (item.isEdited ? "Ya" : "-") : ""
          })
        })
        rowNum++
      })
      
      const unitObj = userUnitId ? schoolUnits.find(u => u.id === userUnitId) : undefined
      const rawLabel = selectedJenisPengeluaran !== "ALL" ? (opsiJenisPengeluaran.find(o => o.value === selectedJenisPengeluaran)?.label || selectedJenisPengeluaran) : ""
      const jenisText = rawLabel ? rawLabel.replace(/^Semua\s+/i, "") : ""
      const excelFilename = jenisText
        ? `Kas_Keluar_${jenisText.replace(/[^a-zA-Z0-9_-]/g, '_')}_${format(new Date(), "yyyyMMdd")}`.replace(/\s+/g, '_')
        : `Kas_Keluar_${format(new Date(), "yyyyMMdd")}`

      exportToExcel(exportData, excelFilename, {
        title: jenisText ? `Laporan Kas Keluar - ${jenisText}` : "Laporan Kas Keluar (Pengeluaran)",
        unitInfo: unitObj || pengaturan || { name: "Yayasan Siraya" }
      })
      toast.success("Berhasil mengekspor Excel")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mengekspor Excel")
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    try {
      const { exportTablePdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo, getSignatoryKiri } = await import("@/lib/pdf-helpers")
      
      const tableColumn = ["No", "Tgl Transaksi", "No Referensi", "Penerima", "Deskripsi", "Total Nilai", "Pembuat", "Status"]
      const tableRows: any[][] = []
      let rowNum = 1
      filteredData.forEach((item: any) => {
        const items = getVisibleItemsForKasKeluar(item, selectedJenisPengeluaran)
        items.forEach((it, i) => {
          tableRows.push([
            i === 0 ? rowNum : "",
            i === 0 ? format(new Date(item.tanggal), "dd/MM/yyyy") : "",
            i === 0 ? item.noReferensi : "",
            i === 0 ? (item.penerima?.name || item.namaPihakKetiga || "-") : "",
            it.keterangan,
            `Rp ${it.nominal.toLocaleString('id-ID')}`,
            i === 0 ? (item.pembuat?.name || "-") : "",
            i === 0 ? item.status : ""
          ])
        })
        rowNum++
      })

      if (filteredData.length > 0) {
        const totalNilaiAll = filteredData.reduce((acc: number, curr: any) => {
          const items = getVisibleItemsForKasKeluar(curr, selectedJenisPengeluaran)
          return acc + items.reduce((s, it) => s + it.nominal, 0)
        }, 0)
        tableRows.push([
          "",
          "TOTAL PENGELUARAN",
          "",
          "",
          "",
          `Rp ${totalNilaiAll.toLocaleString('id-ID')}`,
          "",
          ""
        ])
      }

      const unitObj = userUnitId ? schoolUnits.find((u: any) => u.id === userUnitId) : undefined
      const rawLabel = selectedJenisPengeluaran !== "ALL" ? (opsiJenisPengeluaran.find(o => o.value === selectedJenisPengeluaran)?.label || selectedJenisPengeluaran) : ""
      const jenisText = rawLabel ? rawLabel.replace(/^Semua\s+/i, "") : ""
      const pdfTitle = jenisText ? `Laporan Kas Keluar - ${jenisText}` : "Laporan Kas Keluar (Pengeluaran)"
      const pdfFilename = jenisText
        ? `Kas_Keluar_${jenisText.replace(/[^a-zA-Z0-9_-]/g, '_')}_${unitObj?.name || "Semua"}_${format(new Date(), "yyyyMMdd")}`.replace(/\s+/g, '_')
        : `Kas_Keluar_${unitObj?.name || "Semua"}_${format(new Date(), "yyyyMMdd")}`.replace(/\s+/g, '_')
      const filterLabel = rawLabel ? ` • Jenis: ${rawLabel}` : ""

      await exportTablePdf({
        institutionInfo: buildInstitutionInfo(pengaturan, unitObj),
        title: pdfTitle,
        subtitle: `Unit: ${unitObj?.name || "Semua Unit"}${filterLabel} • Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        headers: tableColumn,
        data: tableRows,
        filename: pdfFilename,
        config: { orientation: 'landscape' },
        penandatanganKiri: getSignatoryKiri(pengaturan, unitObj),
        penandatanganKanan: { jabatan: "Bendahara Pengeluaran,", nama: unitObj?.namaBendaharaUnit || pengaturan?.namaBendaharaYayasan || userName || "____________________" }
      })

      toast.success("Berhasil mengekspor PDF")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mengekspor PDF")
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <div className="w-full">
      <PageHeader 
        title={isReadOnly ? "Audit Pengeluaran & Belanja Unit" : "Kas Keluar (Pengeluaran)"}
        subtitle={isReadOnly
          ? "Pengawasan belanja operasional, verifikasi bukti nota kas keluar, dan audit anggaran unit"
          : "Kelola data pengeluaran kas dan pembiayaan Yayasan"}
      />

      {/* Executive Expense Watch for KEPALA_SEKOLAH / YAYASAN */}
      {isReadOnly && (
        <div className="mb-6 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Ringkasan Kas Keluar
            </h2>
            <span className="text-xs bg-slate-50 px-2.5 py-1 rounded-lg text-slate-600 font-medium border border-slate-200 uppercase">
              Periode: {timeRange}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
            <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-100">
              <p className="text-[11px] sm:text-xs font-bold text-rose-700 uppercase tracking-wider">Total Pengeluaran</p>
              <p className="text-lg sm:text-xl font-black mt-1 text-rose-600 truncate">
                Rp {executiveMetrics.totalKeluar.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-100">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Frekuensi Belanja</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg sm:text-xl font-black text-slate-900">{executiveMetrics.countTrans}</span>
                <span className="text-xs font-medium text-slate-500">Nota</span>
              </div>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-100">
              <p className="text-[11px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider">Belanja ≥ Rp 1 Jt</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg sm:text-xl font-black text-amber-800">{executiveMetrics.largeTrans}</span>
                <span className="text-xs font-medium text-slate-500">Nota</span>
              </div>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-100">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata per Nota</p>
              <p className="text-lg sm:text-xl font-black mt-1 text-slate-900 truncate">
                Rp {executiveMetrics.avgTrans.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6">
        
        {/* Tabs Navigation */}
        <TabNavigation
          tabs={[{ id: "kas-keluar", label: isReadOnly ? "Daftar Audit Kas Keluar" : "Daftar Kas Keluar", icon: ArrowUpRight, badge: filteredData.length }]}
        />

        {/* Filters and Actions */}
        <Toolbar>
          <ToolbarSearch 
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Cari No Ref atau Nama..." 
          />

          <div className="grid grid-cols-2 sm:flex gap-2.5 w-full sm:w-auto">
            {opsiJenisPengeluaran && opsiJenisPengeluaran.length > 0 && (
              <ToolbarFilter
                icon={<Layers size={14} />}
                value={selectedJenisPengeluaran}
                onChange={(val) => setSelectedJenisPengeluaran(val)}
                options={opsiJenisPengeluaran}
                className="col-span-2 sm:col-span-1 sm:max-w-[200px] xl:max-w-[220px]"
              />
            )}

            <ToolbarFilter
              icon={<Filter size={14} />}
              value={filterBy}
              onChange={(val) => setFilterBy(val as any)}
              options={[
                { label: "Tgl Transaksi", value: "tanggal_transaksi" },
                { label: "Tgl Pembuatan", value: "tanggal_pembuatan" }
              ]}
            />

            <ToolbarFilter
              icon={<CalendarIcon size={14} />}
              value={timeRange}
              onChange={(val) => setTimeRange(val as any)}
              options={[
                { label: "Semua Waktu", value: "semua" },
                { label: "Hari Ini", value: "hari" },
                { label: "Minggu Ini", value: "minggu" },
                { label: "Bulan Ini", value: "bulan" },
                { label: "Bulan Lalu", value: "bulan_lalu" },
                { label: "Custom Tanggal", value: "custom" }
              ]}
            />
          </div>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input type="date" className="bg-bg border border-border rounded-xl px-3 py-2 text-sm w-full sm:w-auto min-h-[44px] sm:min-h-[38px]" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="text-text-muted">-</span>
              <input type="date" className="bg-bg border border-border rounded-xl px-3 py-2 text-sm w-full sm:w-auto min-h-[44px] sm:min-h-[38px]" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          )}

          <ToolbarActions>
            <ToolbarRefreshButton 
              onClick={handleRefresh} 
              title="Segarkan Data" 
            />
            <ToolbarExportExcel 
              onClick={handleExportExcel}
              disabled={isExportingExcel || filteredData.length === 0}
              isExporting={isExportingExcel}
            />
            <ToolbarExportPDF 
              onClick={handleExportPDF}
              disabled={isExportingPDF || filteredData.length === 0}
              isExporting={isExportingPDF}
            />
            
            {isReadOnly ? null : (
              <>
                <ToolbarDivider />
                <Link href="/kas-keluar/tambah" className="col-span-2 sm:col-span-1 w-full sm:w-auto">
                  <ToolbarAddButton onClick={() => {}}>
                    Tambah Data
                  </ToolbarAddButton>
                </Link>
              </>
            )}
          </ToolbarActions>
        </Toolbar>

        {/* Table & Centered Empty State */}
        {filteredData.length === 0 ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center text-text-muted w-full">
            <Receipt size={40} className="text-gray-300 mb-3 stroke-[1.5]" />
            <p className="font-bold text-text-main text-base mb-1">
              {selectedJenisPengeluaran !== "ALL" || searchTerm ? "Tidak Ada Data yang Cocok" : "Belum Ada Transaksi Kas Keluar"}
            </p>
            <p className="text-xs text-text-muted max-w-sm">
              {selectedJenisPengeluaran !== "ALL" || searchTerm ? "Coba sesuaikan filter jenis pengeluaran atau kata kunci pencarian." : "Data transaksi kas keluar akan muncul di sini setelah dibuat."}
            </p>
          </div>
        ) : (
          <>
            <TableScrollHint totalRows={filteredData.length} />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold text-center">NO</th>
                    <th className="p-4 font-semibold">TGL TRANSAKSI</th>
                    <th className="p-4 font-semibold">TGL PEMBUATAN</th>
                    <th className="p-4 font-semibold">NO REFERENSI</th>
                    <th className="p-4 font-semibold">NO FORMULIR</th>
                    <th className="p-4 font-semibold">PENERIMA</th>
                    <th className="p-4 font-semibold">DESKRIPSI</th>
                    <th className="p-4 font-semibold text-left">TOTAL NILAI</th>
                    <th className="p-4 font-semibold">PEMBUAT</th>
                    <th className="p-4 font-semibold text-center">STATUS</th>
                    <th className="p-4 font-semibold text-center">REVISI</th>
                    <th className="p-4 font-semibold text-right">{isReadOnly ? "AUDIT NOTA" : "AKSI"}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item: any, idx: number) => {
                    const items = getVisibleItemsForKasKeluar(item, selectedJenisPengeluaran)
                    const rowTotal = items.reduce((s, it) => s + it.nominal, 0)
                    return (
                    <tr key={item.id} className="align-top border-b border-border hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 text-center text-text-muted">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="p-4 font-medium text-text-main">{format(new Date(item.tanggal), 'dd MMM yyyy', { locale: idLocale })}</td>
                      <td className="p-4 text-text-muted">{format(new Date(item.createdAt), 'dd MMM yyyy HH:mm', { locale: idLocale })}</td>
                      <td className="p-4 font-semibold text-primary">{item.noReferensi}</td>
                      <td className="p-4 text-text-muted">{item.noFormulir || "-"}</td>
                      <td className="p-4 font-medium">{item.penerima?.name || item.namaPihakKetiga || "-"}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5 py-0.5">
                          {items.map((it, i) => (
                            <span 
                              key={i} 
                              className="text-xs leading-5 text-text-main font-medium truncate max-w-[240px] xl:max-w-[320px] block" 
                              title={it.keterangan}
                            >
                              {it.keterangan}
                            </span>
                          ))}
                          {items.length > 1 && (
                            <div className="flex items-center h-5 border-t border-dashed border-border/80 pt-0.5 mt-0.5">
                              <span className="text-xs leading-5 font-bold text-text-main uppercase tracking-wider">
                                Total
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-left">
                        <div className="flex flex-col gap-0.5 py-0.5 text-left items-start">
                          {items.map((it, i) => (
                            <div key={i} className="flex items-center justify-start h-5">
                              <span className="text-xs leading-5 tabular-nums font-normal text-text-main whitespace-nowrap">
                                Rp {it.nominal.toLocaleString('id-ID')}
                              </span>
                              {isReadOnly && it.nominal >= 1000000 && items.length === 1 && (
                                <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium leading-tight">
                                  &ge; 1 Jt
                                </span>
                              )}
                            </div>
                          ))}
                          {items.length > 1 && (
                            <div className="flex items-center justify-start h-5 border-t border-dashed border-border/80 pt-0.5 mt-0.5 w-full">
                              <span className="text-xs leading-5 tabular-nums font-bold text-text-main whitespace-nowrap">
                                Rp {rowTotal.toLocaleString('id-ID')}
                              </span>
                              {isReadOnly && rowTotal >= 1000000 && (
                                <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium leading-tight">
                                  &ge; 1 Jt
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-text-muted">{item.pembuat?.name || "-"}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-center text-xs">
                        {item.isEdited ? (
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-600 rounded-md font-medium" title={item.editReason}>Ya</span>
                        ) : (
                          <span className="text-text-muted/50">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {isReadOnly ? (
                          <Link
                            href={`/kas-keluar/${item.id}?tab=resi`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors font-bold text-xs"
                          >
                            <Receipt size={14} /> Audit Nota
                          </Link>
                        ) : (
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <Button variant="outline" className="h-9 px-3 flex items-center gap-2 bg-white hover:bg-bg/50 shadow-sm">
                                <span className="text-xs font-semibold text-text-main">Aksi</span>
                                <ChevronDown size={16} className="text-text-muted" />
                              </Button>
                            </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content 
                              align="end"
                              className="w-40 bg-white rounded-lg shadow-lg border border-border py-1 z-[100] animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                            >
                              <DropdownMenu.Item 
                                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-bg/50 transition-colors flex items-center cursor-pointer outline-none"
                                onClick={() => router.push(`/kas-keluar/${item.id}?tab=resi`)}
                              >
                                <Receipt size={14} className="mr-2 text-text-muted" /> Detail
                              </DropdownMenu.Item>
                              <DropdownMenu.Item 
                                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-bg/50 transition-colors flex items-center cursor-pointer outline-none"
                                onClick={() => router.push(`/kas-keluar/${item.id}?tab=jurnal`)}
                              >
                                <Eye size={14} className="mr-2 text-text-muted" /> Jurnal
                              </DropdownMenu.Item>
                              <DropdownMenu.Item 
                                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-bg/50 transition-colors flex items-center cursor-pointer outline-none"
                                onClick={() => router.push(`/kas-keluar/${item.id}/edit`)}
                              >
                                <Edit size={14} className="mr-2 text-blue-500" /> Ubah
                              </DropdownMenu.Item>
                              <DropdownMenu.Separator className="h-px bg-border my-1" />
                              <DropdownMenu.Item 
                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center cursor-pointer outline-none"
                                onClick={() => setDeleteId(item.id)}
                              >
                                <Trash2 size={14} className="mr-2" /> Hapus
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      )}
                    </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {filteredData.length > 0 && (
          <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface text-sm rounded-b-2xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-muted">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <span className="font-medium text-text-muted">
                Hal {currentPage} dari {computedTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === computedTotalPages || computedTotalPages === 0}
                onClick={() => setCurrentPage(p => Math.min(computedTotalPages, p + 1))}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <ConfirmModal 
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Transaksi Kas Keluar"
        message="Apakah Anda yakin ingin menghapus transaksi ini? Data jurnal dan saldo akan disesuaikan kembali. Tindakan ini tidak dapat dibatalkan."
        confirmText={isDeleting ? "Menghapus..." : "Hapus Transaksi"}
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

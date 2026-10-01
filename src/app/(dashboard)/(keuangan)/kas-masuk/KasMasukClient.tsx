"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Plus, Printer, Download, Eye, Edit, Trash2, Calendar as CalendarIcon, Filter, Receipt, ChevronDown, FileSpreadsheet, FileText, ArrowDownLeft, Layers } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { TabNavigation } from "@/components/ui/TabNavigation"
import { TableScrollHint } from "@/components/ui/TableScrollHint"
import { format, isToday, isThisWeek, isThisMonth, isWithinInterval, startOfDay, endOfDay, subMonths } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { hapusKasMasuk } from "@/actions/kas-masuk"
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

type TransaksiWithRelations = any // Type will be inferred properly in real project

export interface KasMasukItem {
  keterangan: string
  nominal: number
  akunId?: string
  akunKode?: string
  akunNama?: string
}

export function extractKasMasukItems(item: any): KasMasukItem[] {
  // 1. Jika bersumber dari pembayaran tagihan murid (SPP, BAT, DSP, dll.)
  if (item.pembayaranTagihan && Array.isArray(item.pembayaranTagihan) && item.pembayaranTagihan.length > 0) {
    return item.pembayaranTagihan.map((pt: any) => ({
      keterangan: pt.tagihan?.namaTagihan || pt.tagihan?.akun?.nama || item.deskripsi || "Tagihan",
      nominal: Number(pt.jumlahDibayar) || 0,
      akunId: pt.tagihan?.akun?.id || pt.tagihan?.akunId,
      akunKode: pt.tagihan?.akun?.kode,
      akunNama: pt.tagihan?.akun?.nama
    }))
  }

  // 2. Jika transaksi pembukuan umum kas masuk (berdasarkan baris KREDIT)
  const kreditDetails = item.detail ? item.detail.filter((d: any) => d.posisi === "KREDIT") : []
  if (kreditDetails.length > 0) {
    return kreditDetails.map((d: any) => ({
      keterangan: `${d.akun?.nama || ''} ${d.deskripsi ? `(${d.deskripsi})` : ''}`.trim() || item.deskripsi || "Penerimaan",
      nominal: Number(d.nilai) || 0,
      akunId: d.akun?.id,
      akunKode: d.akun?.kode,
      akunNama: d.akun?.nama
    }))
  }

  // 3. Fallback jika tidak memiliki detail
  return [
    {
      keterangan: item.deskripsi || "Penerimaan Kas Masuk",
      nominal: Number(item.totalNilai) || 0
    }
  ]
}

export function filterItemMatches(it: KasMasukItem, filterVal: string): boolean {
  if (!filterVal || filterVal === "ALL") return true
  if (filterVal.startsWith("CAT:")) {
    const cat = filterVal.replace("CAT:", "").toUpperCase()
    const targetText = `${it.keterangan} ${it.akunNama || ''}`.toUpperCase()
    if (cat === "DAFTAR_ULANG") {
      return targetText.includes("DAFTAR ULANG") || targetText.includes("DAFTAR_ULANG")
    }
    return targetText.includes(cat)
  }
  if (filterVal.startsWith("AKUN:")) {
    const targetAkunId = filterVal.replace("AKUN:", "")
    return it.akunId === targetAkunId
  }
  return true
}

export function getVisibleItemsForTransaksi(item: any, filterVal: string): KasMasukItem[] {
  const allItems = extractKasMasukItems(item)
  if (!filterVal || filterVal === "ALL") return allItems
  return allItems.filter(it => filterItemMatches(it, filterVal))
}

export default function KasMasukClient({ 
  initialData, 
  userRole, 
  pengaturan, 
  schoolUnits = [], 
  userUnitId, 
  userName,
  opsiJenisBayar = []
}: { 
  initialData: TransaksiWithRelations[], 
  userRole: string, 
  pengaturan?: any, 
  schoolUnits?: any[], 
  userUnitId?: string, 
  userName?: string,
  opsiJenisBayar?: { label: string, value: string }[]
}) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedJenisBayar, setSelectedJenisBayar] = useState<string>("ALL")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const isReadOnly = userRole === "KEPALA_SEKOLAH" || userRole === "YAYASAN"
  
  const [filterBy, setFilterBy] = useState<'tanggal_transaksi' | 'tanggal_pembuatan'>('tanggal_transaksi')
  const [timeRange, setTimeRange] = useState<'semua' | 'hari' | 'minggu' | 'bulan' | 'bulan_lalu' | 'custom'>('semua')
  
  // Custom date state if needed
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const handleRefresh = () => {
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusKasMasuk(deleteId)
      toast.success("Transaksi Kas Masuk berhasil dihapus")
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
      // 1. Filter Jenis Bayar
      const visibleItems = getVisibleItemsForTransaksi(item, selectedJenisBayar)
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
        return isThisWeek(dateToFilter, { weekStartsOn: 1 }) // Senin sebagai awal minggu
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
  }, [data, searchTerm, filterBy, timeRange, startDate, endDate, selectedJenisBayar])

  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterBy, timeRange, startDate, endDate, selectedJenisBayar])

  const paginatedData = useMemo(() => {
    return filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredData, currentPage, pageSize])

  const computedTotalPages = Math.ceil(filteredData.length / pageSize)

  const executiveMetrics = useMemo(() => {
    const totalMasuk = filteredData.reduce((sum: number, item: any) => {
      const items = getVisibleItemsForTransaksi(item, selectedJenisBayar)
      return sum + items.reduce((s, it) => s + it.nominal, 0)
    }, 0)
    const countTrans = filteredData.length
    const largeTrans = filteredData.filter((item: any) => {
      const items = getVisibleItemsForTransaksi(item, selectedJenisBayar)
      const transTotal = items.reduce((s, it) => s + it.nominal, 0)
      return transTotal >= 1000000
    }).length
    const avgTrans = countTrans > 0 ? Math.round(totalMasuk / countTrans) : 0
    return {
      totalMasuk,
      countTrans,
      largeTrans,
      avgTrans
    }
  }, [filteredData, selectedJenisBayar])

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const { exportToExcel } = await import("@/lib/excel")
      const exportData = filteredData.map((item: any, index: number) => {
        const items = getVisibleItemsForTransaksi(item, selectedJenisBayar)
        const rowTotal = items.reduce((s, it) => s + it.nominal, 0)
        const deskripsiStr = items.length > 1
          ? `${items.map(it => it.keterangan).join("\n")}\nTotal`
          : (items[0]?.keterangan || item.deskripsi || "-")
        const nominalStr = items.length > 1
          ? `${items.map(it => `Rp ${it.nominal.toLocaleString('id-ID')}`).join("\n")}\nRp ${rowTotal.toLocaleString('id-ID')}`
          : `Rp ${rowTotal.toLocaleString('id-ID')}`

        return {
          No: index + 1,
          "Tgl Transaksi": format(new Date(item.tanggal), "dd/MM/yyyy"),
          "Tgl Pembuatan": format(new Date(item.createdAt), "dd/MM/yyyy HH:mm"),
          "No Referensi": item.noReferensi,
          "No Formulir": item.noFormulir || "-",
          "Penyetor": item.namaPihakKetiga || "-",
          "Deskripsi": deskripsiStr,
          "Total Nilai": nominalStr,
          "Pembuat": item.creator?.name || item.pembuat?.name || "-",
          "Status": item.status,
          "Revisi": item.isEdited ? "Ya" : "-"
        }
      })
      
      const unitObj = userUnitId ? schoolUnits.find(u => u.id === userUnitId) : undefined
      const rawLabel = selectedJenisBayar !== "ALL" ? (opsiJenisBayar.find(o => o.value === selectedJenisBayar)?.label || selectedJenisBayar) : ""
      const jenisText = rawLabel ? rawLabel.replace(/^Semua\s+/i, "") : ""
      const excelTitle = jenisText ? `Laporan Kas Masuk - ${jenisText}` : "Laporan Kas Masuk (Penerimaan)"
      const excelFilename = jenisText 
        ? `Kas_Masuk_${jenisText.replace(/[^a-zA-Z0-9_-]/g, '_')}_${format(new Date(), "yyyyMMdd")}`
        : `Kas_Masuk_${format(new Date(), "yyyyMMdd")}`
      
      exportToExcel(exportData, excelFilename, {
        title: excelTitle,
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
      
      const tableColumn = ["No", "Tgl Transaksi", "No Referensi", "Penyetor", "Deskripsi", "Total Nilai", "Pembuat"]
      const tableRows: any[][] = filteredData.map((item: any, index: number) => {
        const items = getVisibleItemsForTransaksi(item, selectedJenisBayar)
        const rowTotal = items.reduce((s, it) => s + it.nominal, 0)
        const deskripsiStr = items.length > 1
          ? `${items.map(it => it.keterangan).join("\n")}\nTotal`
          : (items[0]?.keterangan || item.deskripsi || "-")
        const nominalStr = items.length > 1
          ? `${items.map(it => `Rp\u00A0${it.nominal.toLocaleString('id-ID')}`).join("\n")}\nRp\u00A0${rowTotal.toLocaleString('id-ID')}`
          : `Rp\u00A0${rowTotal.toLocaleString('id-ID')}`

        return [
          index + 1,
          format(new Date(item.tanggal), "dd/MM/yyyy"),
          item.noReferensi,
          item.namaPihakKetiga || "-",
          deskripsiStr,
          nominalStr,
          item.creator?.name || item.pembuat?.name || "-"
        ]
      })

      if (filteredData.length > 0) {
        const totalNilaiAll = filteredData.reduce((acc: number, curr: any) => {
          const items = getVisibleItemsForTransaksi(curr, selectedJenisBayar)
          return acc + items.reduce((s, it) => s + it.nominal, 0)
        }, 0)
        tableRows.push([
          "",
          "TOTAL PENERIMAAN",
          "",
          "",
          "",
          `Rp\u00A0${totalNilaiAll.toLocaleString('id-ID')}`,
          ""
        ])
      }

      const unitObj = userUnitId ? schoolUnits.find((u: any) => u.id === userUnitId) : undefined
      const rawLabel = selectedJenisBayar !== "ALL" ? (opsiJenisBayar.find(o => o.value === selectedJenisBayar)?.label || selectedJenisBayar) : ""
      const jenisText = rawLabel ? rawLabel.replace(/^Semua\s+/i, "") : ""
      const pdfTitle = jenisText ? `Laporan Kas Masuk - ${jenisText}` : "Laporan Kas Masuk (Penerimaan)"
      const pdfFilename = jenisText
        ? `Kas_Masuk_${jenisText.replace(/[^a-zA-Z0-9_-]/g, '_')}_${unitObj?.name || "Semua"}_${format(new Date(), "yyyyMMdd")}`.replace(/\s+/g, '_')
        : `Kas_Masuk_${unitObj?.name || "Semua"}_${format(new Date(), "yyyyMMdd")}`.replace(/\s+/g, '_')
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
        penandatanganKanan: { jabatan: "Bendahara Penerima,", nama: unitObj?.namaBendaharaUnit || pengaturan?.namaBendaharaYayasan || userName || "____________________" }
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
        title={isReadOnly ? "Audit Penerimaan Kas Masuk" : "Kas Masuk (Penerimaan)"}
        subtitle={isReadOnly
          ? "Pengawasan dan audit aliran kas masuk, bukti setoran, dan verifikasi penerimaan kas unit"
          : "Kelola data penerimaan kas dan pendapatan Yayasan"}
      />

      {/* Executive Cashflow Watch for KEPALA_SEKOLAH */}
      {/* Executive Cashflow Watch for KEPALA_SEKOLAH / YAYASAN */}
      {isReadOnly && (
        <div className="mb-6 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Ringkasan Kas Masuk
            </h2>
            <span className="text-xs bg-slate-50 px-2.5 py-1 rounded-lg text-slate-600 font-medium border border-slate-200 uppercase">
              Periode: {timeRange}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
            <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-100">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kas Masuk</p>
              <p className="text-lg sm:text-xl font-black mt-1 text-[#065f32] truncate">
                Rp {executiveMetrics.totalMasuk.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-100">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Frekuensi Transaksi</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg sm:text-xl font-black text-slate-900">{executiveMetrics.countTrans}</span>
                <span className="text-xs font-medium text-slate-500">Transaksi</span>
              </div>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-100">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Transaksi ≥ Rp 1 Jt</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg sm:text-xl font-black text-slate-900">{executiveMetrics.largeTrans}</span>
                <span className="text-xs font-medium text-slate-500">Nota</span>
              </div>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-100">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Masuk</p>
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
          tabs={[{ id: "kas-masuk", label: isReadOnly ? "Daftar Audit Kas Masuk" : "Daftar Kas Masuk", icon: ArrowDownLeft, badge: filteredData.length }]}
        />

        {/* Filters and Actions */}
        <Toolbar>
          <ToolbarSearch 
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Cari No Ref atau Nama..." 
          />

          <div className="grid grid-cols-2 sm:flex gap-2.5 w-full sm:w-auto">
            {opsiJenisBayar && opsiJenisBayar.length > 0 && (
              <ToolbarFilter
                icon={<Layers size={14} />}
                value={selectedJenisBayar}
                onChange={(val) => setSelectedJenisBayar(val)}
                options={opsiJenisBayar}
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
                <Link href="/kas-masuk/tambah" className="col-span-2 sm:col-span-1 w-full sm:w-auto">
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
              {selectedJenisBayar !== "ALL" || searchTerm ? "Tidak Ada Data yang Cocok" : "Belum Ada Transaksi Kas Masuk"}
            </p>
            <p className="text-xs text-text-muted max-w-sm">
              {selectedJenisBayar !== "ALL" || searchTerm ? "Coba sesuaikan filter jenis bayar atau kata kunci pencarian." : "Data transaksi kas masuk akan muncul di sini setelah dibuat."}
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
                    <th className="p-4 font-semibold">PENYETOR</th>
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
                    const items = getVisibleItemsForTransaksi(item, selectedJenisBayar)
                    const rowTotal = items.reduce((s, it) => s + it.nominal, 0)
                    return (
                    <tr key={item.id} className="align-top border-b border-border hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 text-center text-text-muted">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="p-4 font-medium text-text-main">{format(new Date(item.tanggal), 'dd MMM yyyy', { locale: idLocale })}</td>
                      <td className="p-4 text-text-muted">{format(new Date(item.createdAt), 'dd MMM yyyy HH:mm', { locale: idLocale })}</td>
                      <td className="p-4 font-semibold text-primary">{item.noReferensi}</td>
                      <td className="p-4 text-text-muted">{item.noFormulir || "-"}</td>
                      <td className="p-4 font-medium">{item.namaPihakKetiga || "-"}</td>
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
                                <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium leading-tight">
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
                                <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium leading-tight">
                                  &ge; 1 Jt
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-text-muted">{item.creator?.name || item.pembuat?.name || "-"}</td>
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
                            href={`/kas-masuk/${item.id}?tab=resi`}
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
                                onClick={() => router.push(`/kas-masuk/${item.id}?tab=resi`)}
                              >
                                <Receipt size={14} className="mr-2 text-text-muted" /> Detail
                              </DropdownMenu.Item>
                              <DropdownMenu.Item 
                                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-bg/50 transition-colors flex items-center cursor-pointer outline-none"
                                onClick={() => router.push(`/kas-masuk/${item.id}?tab=jurnal`)}
                              >
                                <Eye size={14} className="mr-2 text-text-muted" /> Jurnal
                              </DropdownMenu.Item>
                              <DropdownMenu.Item 
                                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-bg/50 transition-colors flex items-center cursor-pointer outline-none"
                                onClick={() => router.push(`/kas-masuk/${item.id}/edit`)}
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
        title="Hapus Transaksi Kas Masuk"
        message="Apakah Anda yakin ingin menghapus transaksi ini? Data jurnal dan saldo akan disesuaikan kembali. Tindakan ini tidak dapat dibatalkan."
        confirmText={isDeleting ? "Menghapus..." : "Hapus Transaksi"}
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

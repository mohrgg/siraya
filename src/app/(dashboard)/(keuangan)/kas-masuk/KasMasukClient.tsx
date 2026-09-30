"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Plus, Printer, Download, RefreshCw, Eye, Edit, Trash2, Calendar as CalendarIcon, Filter, Receipt, ChevronDown, FileSpreadsheet, FileText, ArrowDownLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { TabNavigation } from "@/components/ui/TabNavigation"
import { TableScrollHint } from "@/components/ui/TableScrollHint"
import { format, isToday, isThisWeek, isThisMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { hapusKasMasuk } from "@/actions/kas-masuk"
import { sinkronkanDeskripsiTagihanLama } from "@/actions/pembayaran-tagihan"
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

export default function KasMasukClient({ initialData, userRole, pengaturan, schoolUnits = [], userUnitId, userName }: { initialData: TransaksiWithRelations[], userRole: string, pengaturan?: any, schoolUnits?: any[], userUnitId?: string, userName?: string }) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const isReadOnly = userRole === "KEPALA_SEKOLAH" || userRole === "YAYASAN"
  
  const [filterBy, setFilterBy] = useState<'tanggal_transaksi' | 'tanggal_pembuatan'>('tanggal_transaksi')
  const [timeRange, setTimeRange] = useState<'hari' | 'minggu' | 'bulan' | 'custom'>('hari')
  
  // Custom date state if needed
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const handleRefresh = () => {
    router.refresh()
  }

  const handleSyncDeskripsi = async () => {
    if (!confirm("Perbarui deskripsi transaksi tagihan siswa lama agar memuat nama pos spesifik (SPP, BAT, PSB, PTS/PAT)?")) return
    setIsSyncing(true)
    const tId = toast.loading("Menyinkronkan deskripsi transaksi tagihan...")
    try {
      const res = await sinkronkanDeskripsiTagihanLama(userUnitId)
      if (res.success) {
        toast.success(`Berhasil memperbarui ${res.count} deskripsi transaksi tagihan!`, { id: tId })
        router.refresh()
      } else {
        toast.error(res.error || "Gagal menyinkronkan deskripsi", { id: tId })
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem", { id: tId })
    } finally {
      setIsSyncing(false)
    }
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
      // 1. Search Filter
      const matchesSearch = item.noReferensi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.namaPihakKetiga || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.deskripsi || "").toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesSearch) return false

      // 2. Date Filter
      const dateToFilter = filterBy === 'tanggal_pembuatan' ? new Date(item.createdAt) : new Date(item.tanggal)
      
      if (timeRange === 'hari') {
        return isToday(dateToFilter)
      } else if (timeRange === 'minggu') {
        return isThisWeek(dateToFilter, { weekStartsOn: 1 }) // Senin sebagai awal minggu
      } else if (timeRange === 'bulan') {
        return isThisMonth(dateToFilter)
      } else if (timeRange === 'custom' && startDate && endDate) {
        const start = startOfDay(new Date(startDate))
        const end = endOfDay(new Date(endDate))
        return isWithinInterval(dateToFilter, { start, end })
      }

      return true
    })
  }, [data, searchTerm, filterBy, timeRange, startDate, endDate])

  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterBy, timeRange, startDate, endDate])

  const paginatedData = useMemo(() => {
    return filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredData, currentPage, pageSize])

  const computedTotalPages = Math.ceil(filteredData.length / pageSize)

  const executiveMetrics = useMemo(() => {
    const totalMasuk = filteredData.reduce((sum: number, item: any) => sum + (item.totalNilai || 0), 0)
    const countTrans = filteredData.length
    const largeTrans = filteredData.filter((item: any) => (item.totalNilai || 0) >= 1000000).length
    const avgTrans = countTrans > 0 ? Math.round(totalMasuk / countTrans) : 0
    return {
      totalMasuk,
      countTrans,
      largeTrans,
      avgTrans
    }
  }, [filteredData])

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const { exportToExcel } = await import("@/lib/excel")
      const exportData = filteredData.map((item: any, index: number) => ({
        No: index + 1,
        "Tgl Transaksi": format(new Date(item.tanggal), "dd/MM/yyyy"),
        "Tgl Pembuatan": format(new Date(item.createdAt), "dd/MM/yyyy HH:mm"),
        "No Referensi": item.noReferensi,
        "No Formulir": item.noFormulir || "-",
        "Penyetor": item.namaPihakKetiga || "-",
        "Deskripsi": item.deskripsi || "-",
        "Total Nilai": item.totalNilai,
        "Pembuat": item.pembuat?.name || "-",
        "Status": item.status,
        "Revisi": item.isEdited ? "Ya" : "-"
      }))
      
      const unitObj = userUnitId ? schoolUnits.find(u => u.id === userUnitId) : undefined
      
      exportToExcel(exportData, `Kas_Masuk_${format(new Date(), "yyyyMMdd")}`, {
        title: "Laporan Kas Masuk (Penerimaan)",
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
      
      const tableColumn = ["No", "Tgl Transaksi", "No Referensi", "Penyetor", "Deskripsi", "Total Nilai", "Pembuat", "Status"]
      const tableRows = filteredData.map((item: any, index: number) => [
        index + 1,
        format(new Date(item.tanggal), "dd/MM/yyyy"),
        item.noReferensi,
        item.namaPihakKetiga || "-",
        item.deskripsi || "-",
        `Rp ${item.totalNilai.toLocaleString('id-ID')}`,
        item.pembuat?.name || "-",
        item.status
      ])

      const unitObj = userUnitId ? schoolUnits.find((u: any) => u.id === userUnitId) : undefined

      exportTablePdf({
        institutionInfo: buildInstitutionInfo(pengaturan, unitObj),
        title: "Laporan Kas Masuk (Penerimaan)",
        subtitle: `Unit: ${unitObj?.name || "Semua Unit"} • Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        headers: tableColumn,
        data: tableRows,
        filename: `Kas_Masuk_${unitObj?.name || "Semua"}_${format(new Date(), "yyyyMMdd")}`.replace(/\s+/g, '_'),
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
                { label: "Hari Ini", value: "hari" },
                { label: "Minggu Ini", value: "minggu" },
                { label: "Bulan Ini", value: "bulan" },
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
            {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncDeskripsi}
                disabled={isSyncing}
                title="Perbarui deskripsi transaksi tagihan siswa lama ke format spesifik (SPP, BAT, PTS/PAT, dll.)"
                className="opacity-100 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 flex items-center gap-1.5 h-9"
              >
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                <span className="hidden md:inline">{isSyncing ? "Sinkronisasi..." : "Sinkron Deskripsi"}</span>
              </Button>
            )}
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
            <p className="font-bold text-text-main text-base mb-1">Belum Ada Transaksi Kas Masuk</p>
            <p className="text-xs text-text-muted max-w-sm">Data transaksi kas masuk akan muncul di sini setelah dibuat.</p>
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
                    <th className="p-4 font-semibold text-right">TOTAL NILAI</th>
                    <th className="p-4 font-semibold">PEMBUAT</th>
                    <th className="p-4 font-semibold text-center">STATUS</th>
                    <th className="p-4 font-semibold text-center">REVISI</th>
                    <th className="p-4 font-semibold text-right">{isReadOnly ? "AUDIT NOTA" : "AKSI"}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 text-center text-text-muted">{idx + 1}</td>
                      <td className="p-4 font-medium text-text-main">{format(new Date(item.tanggal), 'dd MMM yyyy', { locale: idLocale })}</td>
                      <td className="p-4 text-text-muted">{format(new Date(item.createdAt), 'dd MMM yyyy HH:mm', { locale: idLocale })}</td>
                      <td className="p-4 font-semibold text-primary">{item.noReferensi}</td>
                      <td className="p-4 text-text-muted">{item.noFormulir || "-"}</td>
                      <td className="p-4 font-medium">{item.namaPihakKetiga || "-"}</td>
                      <td className="p-4">
                        <span className="truncate max-w-[200px] block" title={item.deskripsi}>{item.deskripsi}</span>
                      </td>
                      <td className="p-4 text-right font-bold text-albas-green">
                        Rp {item.totalNilai.toLocaleString('id-ID')}
                        {isReadOnly && item.totalNilai >= 1000000 && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                            &ge; 1 Jt
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-text-muted">{item.creator?.name || "-"}</td>
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
                  ))}
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

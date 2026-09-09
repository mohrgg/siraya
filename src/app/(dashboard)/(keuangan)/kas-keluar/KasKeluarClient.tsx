"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Plus, Printer, Download, RefreshCw, Eye, Edit, Trash2, Calendar as CalendarIcon, Filter, Receipt, ChevronDown, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { format } from "date-fns"
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
  ToolbarDivider 
} from "@/components/ui/DataTableToolbar"

type TransaksiWithRelations = any // Type will be inferred properly in real project

export default function KasKeluarClient({ initialData, userRole, pengaturan, schoolUnits = [], userUnitId, userName }: { initialData: TransaksiWithRelations[], userRole: string, pengaturan?: any, schoolUnits?: any[], userUnitId?: string, userName?: string }) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const isReadOnly = userRole === "KEPALA_SEKOLAH" || userRole === "YAYASAN"
  
  const [filterBy, setFilterBy] = useState<'tanggal_transaksi' | 'tanggal_pembuatan'>('tanggal_transaksi')
  const [timeRange, setTimeRange] = useState<'hari' | 'minggu' | 'bulan' | 'custom'>('bulan')
  
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

  // Frontend filter for search (since backend filter is already applied, but we can do instant filtering)
  const filteredData = useMemo(() => {
    return data.filter((item: any) => 
      item.noReferensi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.namaPihakKetiga || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.deskripsi || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [data, searchTerm])

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
    const totalKeluar = filteredData.reduce((sum: number, item: any) => sum + (item.totalNilai || 0), 0)
    const countTrans = filteredData.length
    const largeTrans = filteredData.filter((item: any) => (item.totalNilai || 0) >= 1000000).length
    const avgTrans = countTrans > 0 ? Math.round(totalKeluar / countTrans) : 0
    return {
      totalKeluar,
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
        "Penerima": item.penerima?.name || item.namaPihakKetiga || "-",
        "Deskripsi": item.deskripsi || "-",
        "Total Nilai": item.totalNilai,
        "Pembuat": item.pembuat?.name || "-",
        "Status": item.status,
        "Revisi": item.isEdited ? "Ya" : "-"
      }))
      
      const unitObj = userUnitId ? schoolUnits.find(u => u.id === userUnitId) : undefined

      exportToExcel(exportData, `Kas_Keluar_${format(new Date(), "yyyyMMdd")}`, {
        title: "Laporan Kas Keluar (Pengeluaran)",
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
      const tableRows = filteredData.map((item: any, index: number) => [
        index + 1,
        format(new Date(item.tanggal), "dd/MM/yyyy"),
        item.noReferensi,
        item.penerima?.name || item.namaPihakKetiga || "-",
        item.deskripsi || "-",
        `Rp ${item.totalNilai.toLocaleString('id-ID')}`,
        item.pembuat?.name || "-",
        item.status
      ])

      const unitObj = userUnitId ? schoolUnits.find((u: any) => u.id === userUnitId) : undefined

      exportTablePdf({
        institutionInfo: buildInstitutionInfo(pengaturan, unitObj),
        title: "Laporan Kas Keluar (Pengeluaran)",
        subtitle: `Unit: ${unitObj?.name || "Semua Unit"} • Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        headers: tableColumn,
        data: tableRows,
        filename: `Kas_Keluar_${unitObj?.name || "Semua"}_${format(new Date(), "yyyyMMdd")}`.replace(/\s+/g, '_'),
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
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
          {isReadOnly ? "Audit Pengeluaran & Belanja Unit" : "Kas Keluar (Pengeluaran)"}
        </h1>
        <p className="text-text-muted">
          {isReadOnly
            ? "Pengawasan belanja operasional, verifikasi bukti nota kas keluar, dan audit anggaran unit"
            : "Kelola data pengeluaran kas dan pembiayaan Yayasan"}
        </p>
      </div>

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

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        
        {/* Tabs Navigation (Single Tab for Consistency) */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button 
            className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary"
          >
            {isReadOnly ? "Daftar Audit Kas Keluar" : "Daftar Kas Keluar"}
          </button>
        </div>

        {/* Filters and Actions */}
        <Toolbar>
          <ToolbarSearch 
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Cari No Ref atau Nama..." 
          />

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

          {timeRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" className="bg-bg border border-border rounded-xl px-3 py-1.5 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="text-text-muted">-</span>
              <input type="date" className="bg-bg border border-border rounded-xl px-3 py-1.5 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          )}

          <ToolbarActions>
            <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh Data">
              <RefreshCw size={16} />
            </Button>
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
                <Link href="/kas-keluar/tambah">
                  <ToolbarAddButton onClick={() => {}}>
                    Tambah Data
                  </ToolbarAddButton>
                </Link>
              </>
            )}
          </ToolbarActions>
        </Toolbar>

        {/* Table */}
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
                  <td className="p-4 font-medium">{item.penerima?.name || item.namaPihakKetiga || "-"}</td>
                  <td className="p-4">
                    <span className="truncate max-w-[200px] block" title={item.deskripsi}>{item.deskripsi}</span>
                  </td>
                  <td className="p-4 text-right font-bold text-albas-green">
                    Rp {item.totalNilai.toLocaleString('id-ID')}
                    {isReadOnly && item.totalNilai >= 1000000 && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                        &ge; 1 Jt
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-text-muted">{item.pembuat?.name}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${item.status === 'POSTED' ? 'bg-albas-green/10 text-albas-green' : 'bg-red-500/10 text-red-500'}`}>
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
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8">
                    <div className="flex flex-col items-center justify-center text-center text-text-muted">
                      <Receipt size={40} className="text-gray-300 mb-3" />
                      <p>Belum ada Transaksi Kas Keluar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

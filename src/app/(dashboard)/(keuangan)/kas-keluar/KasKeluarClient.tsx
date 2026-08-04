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

type TransaksiWithRelations = any // Type will be inferred properly in real project

export default function KasKeluarClient({ initialData, userRole }: { initialData: TransaksiWithRelations[], userRole: string }) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const isReadOnly = userRole === "KEPALA_SEKOLAH"
  
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

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const XLSX = await import("xlsx")
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
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Kas Keluar")
      XLSX.writeFile(workbook, `Kas_Keluar_${format(new Date(), "yyyyMMdd")}.xlsx`)
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
      const { jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default
      
      const doc = new jsPDF('landscape')
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("YAYASAN AL BASYARIAH", 14, 20)
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text("Laporan Kas Keluar (Pengeluaran)", 14, 27)
      doc.text(`Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 33)

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

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [46, 125, 50] }
      })

      doc.save(`Kas_Keluar_${format(new Date(), "yyyyMMdd")}.pdf`)
      toast.success("Berhasil mengekspor PDF")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mengekspor PDF")
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Kas Keluar (Pengeluaran)</h1>
        <p className="text-text-muted">Kelola data pengeluaran kas dan pembiayaan Yayasan</p>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        
        {/* Tabs Navigation (Single Tab for Consistency) */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button 
            className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary"
          >
            Daftar Kas Keluar
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col xl:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            
            <div className="relative w-full md:w-64 flex-shrink-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Cari No Ref atau Nama..." 
                className="w-full pl-10 pr-10 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-2 py-1">
              <Filter size={14} className="text-text-muted ml-2" />
              <select 
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-text-main py-1"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
              >
                <option value="tanggal_transaksi">Tgl Transaksi</option>
                <option value="tanggal_pembuatan">Tgl Pembuatan</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-2 py-1">
              <CalendarIcon size={14} className="text-text-muted ml-2" />
              <select 
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-text-main py-1"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
              >
                <option value="hari">Hari Ini</option>
                <option value="minggu">Minggu Ini</option>
                <option value="bulan">Bulan Ini</option>
                <option value="custom">Custom Tanggal</option>
              </select>
            </div>

            {timeRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" className="bg-bg border border-border rounded-xl px-3 py-2 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span className="text-text-muted">-</span>
                <input type="date" className="bg-bg border border-border rounded-xl px-3 py-2 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            )}
            
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh Data">
              <RefreshCw size={16} />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExportingExcel || filteredData.length === 0}
              className="opacity-100 border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800"
            >
              <FileSpreadsheet size={16} className="mr-1.5" /> 
              {isExportingExcel ? "Mengekspor..." : "Excel"}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF || filteredData.length === 0}
              className="opacity-100 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800"
            >
              <FileText size={16} className="mr-1.5" /> 
              {isExportingPDF ? "Mengekspor..." : "PDF"}
            </Button>
            
            {isReadOnly ? null : (
              <Link href="/kas-keluar/tambah">
                <Button>
                  <Plus size={16} className="mr-1.5" /> Tambah Kas Keluar
                </Button>
              </Link>
            )}
          </div>
        </div>

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
                <th className="p-4 font-semibold text-right">AKSI</th>
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
                          {isReadOnly ? null : (
                            <>
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
                            </>
                          )}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
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

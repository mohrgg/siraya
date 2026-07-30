"use client"

import { useState } from "react"
import { Search, Plus, Printer, Download, RefreshCw, Eye, Edit, Trash2, Calendar as CalendarIcon, Filter, Receipt } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"

type TransaksiWithRelations = any // Type will be inferred properly in real project

export default function KasMasukClient({ initialData, userRole }: { initialData: TransaksiWithRelations[], userRole: string }) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState<'tanggal_transaksi' | 'tanggal_pembuatan'>('tanggal_transaksi')
  const [timeRange, setTimeRange] = useState<'hari' | 'minggu' | 'bulan' | 'custom'>('bulan')
  
  // Custom date state if needed
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleRefresh = () => {
    // In a real app, call getKasMasuk here with the current filters
    router.refresh()
  }

  // Frontend filter for search (since backend filter is already applied, but we can do instant filtering)
  const filteredData = data.filter((item: any) => 
    item.noReferensi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.namaPihakKetiga || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.deskripsi || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Kas Masuk (Penerimaan)</h1>
        <p className="text-text-muted">Kelola data penerimaan kas dan pendapatan Yayasan</p>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        
        {/* Tabs Navigation (Single Tab for Consistency) */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button 
            className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary"
          >
            Daftar Kas Masuk
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

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleRefresh} title="Refresh Data">
              <RefreshCw size={16} />
            </Button>
            <Button variant="outline" className="text-text-main">
              <Printer size={16} className="mr-1.5" /> PDF
            </Button>
            <Button variant="outline" className="text-albas-green border-albas-green/30 hover:bg-albas-green/5">
              <Download size={16} className="mr-1.5" /> Excel
            </Button>
            
            <Link href="/kas-masuk/tambah">
              <Button>
                <Plus size={16} className="mr-1.5" /> Tambah Kas Masuk
              </Button>
            </Link>
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
                <th className="p-4 font-semibold">PENYETOR</th>
                <th className="p-4 font-semibold">DESKRIPSI</th>
                <th className="p-4 font-semibold text-right">TOTAL NILAI</th>
                <th className="p-4 font-semibold">PEMBUAT</th>
                <th className="p-4 font-semibold text-center">STATUS</th>
                <th className="p-4 font-semibold text-center">REVISI</th>
                <th className="p-4 font-semibold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item: any, idx: number) => (
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
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Lihat Detail">
                        <Eye size={14} className="text-text-muted" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit Transaksi">
                        <Edit size={14} className="text-blue-500" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:border-red-500 hover:bg-red-50" title="Hapus Transaksi">
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8">
                    <div className="flex flex-col items-center justify-center text-center text-text-muted">
                      <Receipt size={40} className="text-gray-300 mb-3" />
                      <p>Belum ada Transaksi Kas Masuk.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

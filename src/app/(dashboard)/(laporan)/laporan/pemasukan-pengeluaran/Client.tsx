"use client"

import { useState, useEffect } from "react"
import { getLaporanPemasukanPengeluaran } from "@/actions/laporan"
import { Calendar as CalendarIcon, Share2, Printer, Search, RefreshCw, Download, ArrowLeft, FileText, FileSpreadsheet } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"

export default function LaporanPemasukanClient({ initialUnitName }: { initialUnitName: string }) {
  const router = useRouter()
  const unitName = initialUnitName

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

  const getDates = (range: string) => {
    const today = new Date()
    let start = new Date()
    let end = new Date()

    if (range === "Minggu Ini") {
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
      start = new Date(today.setDate(diff))
      end = new Date(today.setDate(start.getDate() + 6))
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
      const res = await getLaporanPemasukanPengeluaran(startDate, endDate)
      setData(res)
    } catch (error: any) {
      toast.error("Gagal mengambil data laporan: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const { startDate, endDate } = getDates(dateRange)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Pemasukan & Pengeluaran</h1>
          <p className="text-text-muted">Laporan Laba/Rugi sekolah dalam rentang waktu tertentu</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push("/laporan")}
            className="gap-2 font-bold bg-surface text-text-main hover:bg-surface-hover shadow-sm"
          >
            <ArrowLeft size={16} /> Kembali
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => toast.success("Fitur Ekspor Excel akan segera hadir")} 
            className="opacity-100 border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 shadow-sm"
          >
            <FileSpreadsheet size={16} className="mr-1.5" /> Excel
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => toast.success("Fitur Ekspor PDF akan segera hadir")} 
            className="opacity-100 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 shadow-sm"
          >
            <FileText size={16} className="mr-1.5" /> PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint} 
            className="font-semibold bg-surface shadow-sm border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Printer size={16} className="mr-1.5" /> Cetak
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-surface p-5 rounded-2xl shadow-sm border border-border mb-6">
        <div className="text-sm font-semibold text-gray-600 mb-2">Tanggal</div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center w-full md:w-auto border border-border rounded-lg overflow-hidden bg-gray-50 flex-1 max-w-md">
            <div className="px-3 text-emerald-500 shrink-0 border-r border-border bg-emerald-50 h-full flex items-center justify-center">
              <CalendarIcon size={16} />
            </div>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-transparent border-none py-2.5 px-3 text-sm font-medium focus:ring-0 cursor-pointer"
            >
              <option value="Minggu Ini">Minggu ini</option>
              <option value="Bulan Ini">Bulan ini</option>
              <option value="Tahun Ini">Tahun ini</option>
              <option value="Kustom">Kustom</option>
            </select>
          </div>

          {dateRange === "Kustom" && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input 
                type="date" 
                value={customStart} 
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm w-full md:w-auto"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm w-full md:w-auto"
              />
            </div>
          )}

          <Button onClick={fetchData} disabled={isLoading} className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 shadow-sm gap-2 whitespace-nowrap">
            {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            Filter
          </Button>
        </div>
      </div>

      {/* Report Document */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 print:shadow-none print:border-none print:p-0">
        
        {/* Document Header */}
        <div className="text-center mb-10">
          <div className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-1">Data {unitName}</div>
          <h2 className="text-xl font-bold text-blue-600 uppercase mb-1">LAPORAN PEMASUKAN DAN PENGELUARAN</h2>
          <div className="text-sm font-medium text-rose-500">per {startDate} - {endDate}</div>
        </div>

        {/* Column Header */}
        <div className="flex justify-between items-center pb-2 border-b-2 border-rose-500/20 mb-6 px-4">
          <div className="text-sm font-semibold text-gray-500">Semua Departemen</div>
          <div className="text-sm font-bold text-rose-500 uppercase">Saldo</div>
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
              <div className="flex justify-between font-bold text-blue-600 mb-3 px-4">
                <span className="uppercase tracking-wider">PENDAPATAN</span>
                <span>Rp. <span className="inline-block w-32 text-right">{new Intl.NumberFormat("id-ID").format(data.totalPendapatan)}</span></span>
              </div>
              
              <div className="pl-6 mb-2">
                <div className="font-semibold text-teal-500 text-sm mb-3">PENDAPATAN</div>
                
                {data.pendapatan.length === 0 ? (
                  <div className="text-sm text-gray-400 italic py-2">Tidak ada data pendapatan pada rentang ini.</div>
                ) : (
                  <div className="space-y-2">
                    {data.pendapatan.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-600 hover:bg-blue-50/50 py-1.5 px-4 rounded transition-colors">
                        <div className="flex gap-12 w-full max-w-lg">
                          <span className="text-blue-500 font-mono font-medium">{item.kode}</span>
                          <span className="uppercase">{item.nama}</span>
                        </div>
                        <div className="flex items-center gap-4 whitespace-nowrap">
                          <span>Rp.</span>
                          <span className="inline-block w-32 text-right font-mono">{new Intl.NumberFormat("id-ID").format(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between font-bold text-emerald-500 mt-4 px-4 pt-4 border-t border-gray-100">
                <span>Total PENDAPATAN</span>
                <span>Rp. <span className="inline-block w-32 text-right">{new Intl.NumberFormat("id-ID").format(data.totalPendapatan)}</span></span>
              </div>
              <div className="flex justify-between font-bold text-blue-600 mt-2 px-4">
                <span>Total PENDAPATAN</span>
                <span>Rp. <span className="inline-block w-32 text-right">{new Intl.NumberFormat("id-ID").format(data.totalPendapatan)}</span></span>
              </div>
            </div>

            {/* PENGELUARAN SECTION */}
            <div>
              <div className="flex justify-between font-bold text-blue-600 mb-3 px-4">
                <span className="uppercase tracking-wider">BIAYA BEBAN</span>
                <span>Rp. <span className="inline-block w-32 text-right">{new Intl.NumberFormat("id-ID").format(data.totalPengeluaran)}</span></span>
              </div>
              
              <div className="pl-6 mb-2">
                <div className="font-semibold text-teal-500 text-sm mb-3">PENGELUARAN</div>
                
                {data.pengeluaran.length === 0 ? (
                  <div className="text-sm text-gray-400 italic py-2">Tidak ada data pengeluaran pada rentang ini.</div>
                ) : (
                  <div className="space-y-2">
                    {data.pengeluaran.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-600 hover:bg-blue-50/50 py-1.5 px-4 rounded transition-colors">
                        <div className="flex gap-12 w-full max-w-lg">
                          <span className="text-blue-500 font-mono font-medium">{item.kode}</span>
                          <span className="uppercase">{item.nama}</span>
                        </div>
                        <div className="flex items-center gap-4 whitespace-nowrap">
                          <span>Rp.</span>
                          <span className="inline-block w-32 text-right font-mono">{new Intl.NumberFormat("id-ID").format(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between font-bold text-emerald-500 mt-4 px-4 pt-4 border-t border-gray-100">
                <span>Total PENGELUARAN</span>
                <span>Rp. <span className="inline-block w-32 text-right">{new Intl.NumberFormat("id-ID").format(data.totalPengeluaran)}</span></span>
              </div>
              <div className="flex justify-between font-bold text-blue-600 mt-2 px-4">
                <span>Total BIAYA BEBAN</span>
                <span>Rp. <span className="inline-block w-32 text-right">{new Intl.NumberFormat("id-ID").format(data.totalPengeluaran)}</span></span>
              </div>
            </div>

            {/* SUMMARY SECTION */}
            <div className="pt-6 border-t-2 border-gray-200 space-y-3">
              <div className="flex justify-between text-sm font-semibold text-blue-700 px-4">
                <span>PENGELUARAN OPERASIONAL</span>
                <span>Rp. <span className="inline-block w-32 text-right">0</span></span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-blue-700 px-4">
                <span>Total PENGELUARAN OPERASIONAL</span>
                <span>Rp. <span className="inline-block w-32 text-right">0</span></span>
              </div>
              
              <div className="flex justify-between text-base font-bold text-blue-600 px-4 pt-4 border-t border-gray-100">
                <span>Selisih Pemasukan dan Pengeluaran</span>
                <span>Rp. <span className="inline-block w-32 text-right">{new Intl.NumberFormat("id-ID").format(data.totalPendapatan - data.totalPengeluaran)}</span></span>
              </div>
              
              <div className="flex justify-between text-sm font-bold text-gray-700 px-4">
                <span>Persentase Dana Terpakai</span>
                <span className="flex items-center gap-4">
                  <span>(%)</span>
                  <span className="inline-block w-32 text-right">
                    {data.totalPendapatan > 0 
                      ? ((data.totalPengeluaran / data.totalPendapatan) * 100).toFixed(2) 
                      : "0.00"}
                  </span>
                </span>
              </div>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  )
}

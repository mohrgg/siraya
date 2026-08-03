"use client"

import { useState, useEffect, useMemo } from "react"
import { getLaporanTunggakanSiswa } from "@/actions/laporan"
import { ArrowLeft, Search, Download, Printer, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function LaporanTunggakanClient() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Pagination
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await getLaporanTunggakanSiswa()
      setData(res)
    } catch (error: any) {
      toast.error("Gagal memuat laporan tunggakan: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    const lower = searchTerm.toLowerCase()
    return data.filter(item => 
      (item.namaSiswa || "").toLowerCase().includes(lower) ||
      (item.nis || "").toLowerCase().includes(lower) ||
      (item.namaTagihan || "").toLowerCase().includes(lower) ||
      (item.rombel || "").toLowerCase().includes(lower)
    )
  }, [data, searchTerm])

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-6 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
        <Button 
          variant="outline" 
          onClick={() => router.push("/laporan")}
          className="gap-2 self-start font-bold bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
        >
          <ArrowLeft size={16} /> Kembali
        </Button>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => toast.error("Fitur Ekspor Excel belum tersedia")}
            className="gap-1.5 text-xs font-semibold bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 shadow-sm"
          >
            <Download size={15} /> Excel
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="gap-2 text-xs font-semibold bg-white hover:bg-gray-100 shadow-sm"
          >
            <Printer size={15} /> Cetak Laporan
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border p-6 print:shadow-none print:border-none print:p-0">
        
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 print:hidden">
          <h1 className="text-xl font-bold text-gray-800">Laporan Tunggakan Siswa</h1>
          
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <Input 
              placeholder="Cari nama, NIS, tagihan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-3 font-semibold text-center w-12">NO</th>
                    <th className="p-3 font-semibold">TANGGAL BUAT</th>
                    <th className="p-3 font-semibold">NIS</th>
                    <th className="p-3 font-semibold">NAMA SISWA</th>
                    <th className="p-3 font-semibold">NAMA TAGIHAN</th>
                    <th className="p-3 font-semibold">UNIT SEKOLAH</th>
                    <th className="p-3 font-semibold">ROMBEL</th>
                    <th className="p-3 font-semibold text-right">NOMINAL</th>
                    <th className="p-3 font-semibold text-right">DIBAYAR</th>
                    <th className="p-3 font-semibold text-right">SISA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-gray-500 italic">
                        Tidak ada data tunggakan.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, idx) => {
                      const absoluteIdx = (currentPage - 1) * pageSize + idx + 1
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3 text-center">{absoluteIdx}</td>
                          <td className="p-3 font-mono text-xs text-gray-500">
                            {new Date(item.tanggalBuat).toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-3 font-mono font-medium">{item.nis || "-"}</td>
                          <td className="p-3 font-bold text-gray-700">{item.namaSiswa}</td>
                          <td className="p-3 text-gray-600">{item.namaTagihan}</td>
                          <td className="p-3 text-gray-600">{item.unitSekolah}</td>
                          <td className="p-3 text-gray-600">{item.rombel}</td>
                          <td className="p-3 text-right font-mono">{new Intl.NumberFormat("id-ID").format(item.nominal)}</td>
                          <td className="p-3 text-right font-mono text-emerald-600">{new Intl.NumberFormat("id-ID").format(item.dibayar)}</td>
                          <td className="p-3 text-right font-mono font-bold text-rose-600">{new Intl.NumberFormat("id-ID").format(item.sisa)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 print:hidden">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Show</span>
                  <select 
                    className="border border-gray-200 rounded p-1 bg-gray-50"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>Entries</span>
                </div>

                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-10 p-0"
                  >
                    &lt;
                  </Button>
                  <div className="px-4 py-1.5 text-sm font-medium border border-gray-200 rounded-md bg-gray-50">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="w-10 p-0"
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}

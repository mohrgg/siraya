"use client"

import { useState, useEffect, useMemo } from "react"
import { getLaporanTunggakanSiswa } from "@/actions/laporan"
import { ArrowLeft, Search, Download, Printer, RefreshCw, FileText, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function LaporanTunggakanClient({ pengaturan, schoolUnits = [], grades = [], classrooms = [], userRole, userUnitId }: { pengaturan?: any, schoolUnits?: any[], grades?: any[], classrooms?: any[], userRole?: string, userUnitId?: string }) {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const [filterUnitId, setFilterUnitId] = useState(userUnitId || "")
  const [filterTingkatId, setFilterTingkatId] = useState("")
  const [filterSubKelasId, setFilterSubKelasId] = useState("")
  const unitName = filterUnitId ? (schoolUnits.find(u => u.id === filterUnitId)?.name || "UNIT") : "YAYASAN"

  // Pagination
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await getLaporanTunggakanSiswa(filterUnitId, filterTingkatId, filterSubKelasId)
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
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Laporan Tunggakan Siswa</h1>
          <p className="text-text-muted">Menampilkan daftar rincian sisa tunggakan per murid</p>
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
            className="font-semibold bg-surface hover:bg-surface-hover shadow-sm"
          >
            <Printer size={16} className="mr-1.5" /> Cetak
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-surface p-5 rounded-2xl shadow-sm border border-border mb-6">
        <div className="text-sm font-semibold text-gray-600 mb-2">Filter Laporan</div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          {(userRole === "SUPERADMIN" || userRole === "ADMIN") && (
            <select 
              value={filterUnitId}
              onChange={(e) => { setFilterUnitId(e.target.value); setFilterTingkatId(""); setFilterSubKelasId("") }}
              className="border border-border rounded-lg px-3 py-2 text-sm w-full md:w-auto bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Semua Unit (Yayasan)</option>
              {schoolUnits.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}

          <select 
            value={filterTingkatId}
            onChange={(e) => { setFilterTingkatId(e.target.value); setFilterSubKelasId("") }}
            className="border border-border rounded-lg px-3 py-2 text-sm w-full md:w-auto bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Semua Tingkat</option>
            {grades.filter((g: any) => !filterUnitId || g.unitSekolahId === filterUnitId).map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select 
            value={filterSubKelasId}
            onChange={(e) => setFilterSubKelasId(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm w-full md:w-auto bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Semua Rombel</option>
            {classrooms.filter((c: any) => 
              (!filterUnitId || c.unitSekolahId === filterUnitId) &&
              (!filterTingkatId || c.tingkatId === filterTingkatId)
            ).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <Button onClick={fetchData} disabled={isLoading} className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 shadow-sm gap-2 whitespace-nowrap">
            {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            Terapkan Filter
          </Button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 print:shadow-none print:border-none print:p-0">
        
        {/* KOP SURAT (Hanya Print) */}
        {pengaturan && (
          <div className="hidden print:flex border-b-2 border-black pb-4 mb-6 items-center gap-4">
            {pengaturan.logoUrl && (
              <img src={pengaturan.logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
            )}
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold uppercase">{pengaturan.namaYayasan || "NAMA YAYASAN"}</h1>
              <p className="text-sm">{pengaturan.alamat}</p>
              <p className="text-sm">
                {pengaturan.telepon && `Telp: ${pengaturan.telepon}`} 
                {pengaturan.email && ` | Email: ${pengaturan.email}`} 
                {pengaturan.website && ` | Web: ${pengaturan.website}`}
              </p>
            </div>
          </div>
        )}

        {/* Document Header untuk Print */}
        <div className="hidden print:block text-center mb-6">
          <h2 className="text-xl font-bold text-black uppercase mb-1">LAPORAN TUNGGAKAN SISWA</h2>
          <div className="text-sm font-medium text-gray-800">Data {initialUnitName || "SEMUA UNIT"}</div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 print:hidden">
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

            {/* Tanda Tangan (Hanya Print) */}
            {pengaturan && (
              <div className="hidden print:flex justify-between mt-16 pt-8">
                <div className="text-center w-64">
                  <p className="mb-16">Mengetahui,</p>
                  <p className="font-bold underline">{pengaturan.namaKepalaTU || "____________________"}</p>
                  <p className="text-sm">Kepala Tata Usaha</p>
                </div>
                <div className="text-center w-64">
                  <p className="mb-16">Depok, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="font-bold underline">{pengaturan.namaBendahara || "____________________"}</p>
                  <p className="text-sm">Bendahara Yayasan</p>
                </div>
              </div>
            )}

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

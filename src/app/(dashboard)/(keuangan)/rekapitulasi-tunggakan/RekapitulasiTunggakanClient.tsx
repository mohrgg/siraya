"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Loader2, FileDown, FileSpreadsheet, FileText, RefreshCw } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { getRekapitulasiTunggakan } from "@/actions/rekapitulasi-tunggakan"

interface Akun {
  id: string
  nama: string
  kode: string
}

interface RekapItem {
  subKelasId: string
  subKelasName: string
  totalTagihan: number
  totalDibayar: number
  totalTunggakan: number
  detailKomponen: Record<string, { tagihan: number, dibayar: number, tunggakan: number }>
}

interface Props {
  activeUnitId: string
  activeTahunAkademikId: string
  activeTahunAkademikName: string
}

export default function RekapitulasiTunggakanClient({
  activeUnitId,
  activeTahunAkademikId,
  activeTahunAkademikName
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [rekapData, setRekapData] = useState<RekapItem[]>([])
  const [akunList, setAkunList] = useState<Akun[]>([])
  const [searchTerm1, setSearchTerm1] = useState("")
  const [searchTerm2, setSearchTerm2] = useState("")

  useEffect(() => {
    if (activeUnitId && activeTahunAkademikId) {
      loadData()
    }
  }, [activeUnitId, activeTahunAkademikId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await getRekapitulasiTunggakan(activeUnitId, activeTahunAkademikId)
      if (res.success && res.data && res.akunList) {
        setRekapData(res.data)
        setAkunList(res.akunList)
      } else {
        toast.error(res.message || "Gagal memuat rekapitulasi tunggakan")
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(val)
  }

  const filteredData1 = useMemo(() => {
    return rekapData.filter(item => 
      item.subKelasName.toLowerCase().includes(searchTerm1.toLowerCase())
    )
  }, [rekapData, searchTerm1])

  const filteredData2 = useMemo(() => {
    return rekapData.filter(item => 
      item.subKelasName.toLowerCase().includes(searchTerm2.toLowerCase())
    )
  }, [rekapData, searchTerm2])

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Rekapitulasi Tagihan & Tunggakan</h1>
        <p className="text-text-muted">Berisi ringkasan tagihan serta tunggakan siswa per kelas ({activeTahunAkademikName})</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 bg-surface rounded-2xl shadow-sm border border-border">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <>
          {/* CARD 1: RINGKASAN */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6 mb-6">
            <div className="flex gap-2 mb-6 border-b border-border">
              <button className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary">
                Ringkasan Tagihan & Tunggakan
              </button>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Cari kelas..." 
                  className="w-full pl-9 pr-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                  value={searchTerm1}
                  onChange={e => setSearchTerm1(e.target.value)}
                  disabled={rekapData.length === 0}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-10 p-0 rounded-lg text-emerald-700 border-emerald-600 hover:bg-emerald-50 shrink-0"
                  title="Refresh"
                  onClick={loadData}
                >
                  <RefreshCw size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 rounded-lg text-emerald-700 border-emerald-600 hover:bg-emerald-50 flex items-center gap-2 bg-white"
                  onClick={() => toast.success("Fitur Ekspor Excel akan segera hadir")}
                >
                  <FileSpreadsheet size={16} /> <span className="font-medium">Excel</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 rounded-lg text-rose-600 border-rose-300 hover:bg-rose-50 flex items-center gap-2 bg-white"
                  onClick={() => toast.success("Fitur Ekspor PDF akan segera hadir")}
                >
                  <FileText size={16} /> <span className="font-medium">PDF</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b-2 border-border bg-gray-50 text-text-main text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 text-center w-16 sticky left-0 bg-gray-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">NO</th>
                    <th className="p-4 min-w-[250px] sticky left-16 bg-gray-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">KELAS</th>
                    <th className="p-4 text-right">TOTAL TAGIHAN</th>
                    <th className="p-4 text-right">TOTAL YANG SUDAH DIBAYAR</th>
                    <th className="p-4 text-right">TOTAL TUNGGAKAN BERJALAN</th>
                    <th className="p-4 text-right">TOTAL TUNGGAKAN (KESELURUHAN)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData1.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-text-muted">
                        Tidak ada data kelas yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredData1.map((row, idx) => (
                      <tr key={row.subKelasId} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                        <td className="p-4 text-center text-text-muted font-medium sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-bg/50">
                          {idx + 1}
                        </td>
                        <td className="p-4 font-bold text-text-main sticky left-16 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-bg/50">
                          {row.subKelasName.toUpperCase()}
                        </td>
                        <td className="p-4 text-right font-medium">Rp. {formatRupiah(row.totalTagihan)}</td>
                        <td className="p-4 text-right font-medium">Rp. {formatRupiah(row.totalDibayar)}</td>
                        <td className="p-4 text-right font-medium">Rp. {formatRupiah(row.totalTunggakan)}</td>
                        <td className="p-4 text-right font-medium">Rp. {formatRupiah(row.totalTunggakan)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredData1.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-border/60">
                    <tr>
                      <td colSpan={2} className="p-4 text-right text-text-main sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                        TOTAL KESELURUHAN
                      </td>
                      <td className="p-4 text-right text-emerald-700">
                        Rp. {formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalTagihan, 0))}
                      </td>
                      <td className="p-4 text-right text-emerald-700">
                        Rp. {formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalDibayar, 0))}
                      </td>
                      <td className="p-4 text-right text-emerald-700">
                        Rp. {formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalTunggakan, 0))}
                      </td>
                      <td className="p-4 text-right text-emerald-700">
                        Rp. {formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalTunggakan, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* CARD 2: DETAIL KOMPONEN */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6 mb-6">
            <div className="flex gap-2 mb-6 border-b border-border">
              <button className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary">
                Detail Tunggakan per Komponen
              </button>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Cari kelas..." 
                  className="w-full pl-9 pr-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                  value={searchTerm2}
                  onChange={e => setSearchTerm2(e.target.value)}
                  disabled={rekapData.length === 0}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-10 p-0 rounded-lg text-emerald-700 border-emerald-600 hover:bg-emerald-50 shrink-0"
                  title="Refresh"
                  onClick={loadData}
                >
                  <RefreshCw size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 rounded-lg text-emerald-700 border-emerald-600 hover:bg-emerald-50 flex items-center gap-2 bg-white"
                  onClick={() => toast.success("Fitur Ekspor Excel akan segera hadir")}
                >
                  <FileSpreadsheet size={16} /> <span className="font-medium">Excel</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 rounded-lg text-rose-600 border-rose-300 hover:bg-rose-50 flex items-center gap-2 bg-white"
                  onClick={() => toast.success("Fitur Ekspor PDF akan segera hadir")}
                >
                  <FileText size={16} /> <span className="font-medium">PDF</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b-2 border-border bg-gray-50 text-text-main text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 text-center w-16 sticky left-0 bg-gray-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">NO</th>
                    <th className="p-4 min-w-[250px] sticky left-16 bg-gray-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">KELAS</th>
                    
                    {akunList.map(akun => (
                      <th key={akun.id} className="p-4 text-right min-w-[200px]">
                        {akun.nama.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData2.length === 0 ? (
                    <tr>
                      <td colSpan={2 + akunList.length} className="p-8 text-center text-text-muted">
                        Tidak ada data kelas yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredData2.map((row, idx) => (
                      <tr key={row.subKelasId} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                        <td className="p-4 text-center text-text-muted font-medium sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-bg/50">
                          {idx + 1}
                        </td>
                        <td className="p-4 font-bold text-text-main sticky left-16 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-bg/50">
                          {row.subKelasName.toUpperCase()}
                        </td>
                        
                        {akunList.map(akun => {
                          const val = row.detailKomponen[akun.id]?.tunggakan || 0
                          return (
                            <td key={akun.id} className="p-4 text-right font-medium">
                              {val > 0 ? `Rp. ${formatRupiah(val)}` : "Rp. -"}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredData2.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-border/60">
                    <tr>
                      <td colSpan={2} className="p-4 text-right text-text-main sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                        TOTAL KESELURUHAN
                      </td>
                      
                      {akunList.map(akun => {
                        const colTotal = filteredData2.reduce((acc, r) => acc + (r.detailKomponen[akun.id]?.tunggakan || 0), 0)
                        return (
                          <td key={akun.id} className="p-4 text-right text-emerald-700">
                            Rp. {formatRupiah(colTotal)}
                          </td>
                        )
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

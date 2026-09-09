"use client"

import { useState, useEffect, useMemo } from "react"
import { getLaporanTunggakanSiswa } from "@/actions/laporan"
import { ArrowLeft, Search, Download, Printer, RefreshCw, FileText, FileSpreadsheet, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { exportToExcel } from "@/lib/excel"
import { exportTunggakanMatriksPdf } from "@/lib/pdf"
import { buildInstitutionInfo, getSignatoryKiri } from "@/lib/pdf-helpers"
import { Input } from "@/components/ui/Input"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import PrintHeader from "@/components/shared/print/PrintHeader"
import PrintSignature from "@/components/shared/print/PrintSignature"
import PrintFooter from "@/components/shared/print/PrintFooter"

export default function LaporanTunggakanClient({ pengaturan, schoolUnits = [], grades = [], classrooms = [], userRole, userUnitId, userName }: { pengaturan?: any, schoolUnits?: any[], grades?: any[], classrooms?: any[], userRole?: string, userUnitId?: string, userName?: string }) {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const filterUnitId = userUnitId || ""
  const activeUnit = filterUnitId ? schoolUnits?.find(u => u.id === filterUnitId) : undefined
  const [filterTingkatId, setFilterTingkatId] = useState("")
  const [filterSubKelasId, setFilterSubKelasId] = useState("")
  const unitName = activeUnit ? activeUnit.name : "YAYASAN"

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
  }, [filterUnitId])

  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    const lower = searchTerm.toLowerCase()
    return data.filter(item => 
      (item.namaSiswa || "").toLowerCase().includes(lower) ||
      (item.nis || "").toLowerCase().includes(lower) ||
      (item.deskripsiTagihan || "").toLowerCase().includes(lower) ||
      (item.rombel || "").toLowerCase().includes(lower)
    )
  }, [data, searchTerm])

  const { rows: matrixRows, categories: dynamicCategories } = useMemo(() => {
    const studentMap = new Map<string, any>()
    const categorySet = new Set<string>()

    const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember", "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"]

    const extractMonth = (text: string) => {
      for (const month of MONTH_NAMES) {
        if (new RegExp(`\\b${month}\\b`, 'i').test(text)) {
          return month
        }
      }
      return text
    }

    filteredData.forEach(item => {
      if (!studentMap.has(item.muridId)) {
        studentMap.set(item.muridId, {
          muridId: item.muridId,
          nis: item.nis || "-",
          namaSiswa: item.namaSiswa,
          rombel: item.rombel,
          sppMonths: [],
          sppAmount: 0,
          sppDibayar: 0,
          categories: {} as Record<string, { sisa: number, dibayar: number }>,
          totalTunggakan: 0
        })
      }

      const student = studentMap.get(item.muridId)
      
      if (item.isSPP) {
        if (item.sisa > 0) {
          const month = extractMonth(item.deskripsiTagihan || item.kategori || "")
          if (!student.sppMonths.includes(month)) {
            student.sppMonths.push(month)
          }
        }
        student.sppAmount += item.sisa
        student.sppDibayar += item.dibayar
        student.totalTunggakan += item.sisa
      } else {
        const kat = item.kategori || "Lainnya"
        categorySet.add(kat)
        if (!student.categories[kat]) student.categories[kat] = { sisa: 0, dibayar: 0 }
        student.categories[kat].sisa += item.sisa
        student.categories[kat].dibayar += item.dibayar
        student.totalTunggakan += item.sisa
      }
    })

    const categories = Array.from(categorySet).sort()

    const rows = Array.from(studentMap.values())
      .filter(s => s.totalTunggakan > 0)
      .map(s => ({
        ...s,
        sppMonthString: s.sppMonths.join("/") || "-",
        sppCount: s.sppMonths.length
      }))

    return { rows, categories }
  }, [filteredData])

  const totalPages = Math.ceil(matrixRows.length / pageSize)
  const paginatedData = matrixRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    if (matrixRows.length === 0) return
    const filename = `Laporan_Tunggakan_${unitName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
    
    const excelData = matrixRows.map((item, idx) => {
      const row: any = {
        "No": idx + 1,
        "NIS": item.nis,
        "Nama Siswa": item.namaSiswa,
        "Rombel": item.rombel,
        "Bulan (SPP)": item.sppMonthString,
        "Jml Bln": item.sppCount,
        "Nilai SPP": item.sppAmount,
      }
      dynamicCategories.forEach(cat => {
        const detail = item.categories[cat] || { sisa: 0, dibayar: 0 }
        row[cat] = detail.sisa > 0 ? detail.sisa : (detail.dibayar > 0 ? "LUNAS" : 0)
      })
      row["Total Tunggakan"] = item.totalTunggakan
      return row
    })

    const unitObjForKop = filterUnitId ? schoolUnits.find(u => u.id === filterUnitId) : undefined
    exportToExcel(excelData, filename, {
      title: "Laporan Tunggakan Siswa (Matriks)",
      unitInfo: unitObjForKop || { name: pengaturan?.namaYayasan || "Yayasan Siraya" }
    })
    toast.success("Excel berhasil diunduh")
  }

  const handleExportPdf = () => {
    if (matrixRows.length === 0) return
    
    const filename = `Laporan_Tunggakan_${unitName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`

    exportTunggakanMatriksPdf({
      institutionInfo: buildInstitutionInfo(pengaturan, activeUnit),
      title: "LAPORAN TUNGGAKAN SISWA",
      subtitle: `Per Tanggal: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      data: matrixRows,
      dynamicCategories,
      filename,
      tanggalCetak: new Date(),
      penandatanganKiri: getSignatoryKiri(pengaturan, activeUnit),
      penandatanganKanan: { jabatan: "Petugas Tata Usaha,", nama: activeUnit?.namaKepalaTU || userName || "____________________" }
    })
    
    toast.success("Memproses PDF...")
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
            onClick={handleExportExcel}
            className="opacity-100 border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 shadow-sm"
          >
            <FileSpreadsheet size={16} className="mr-1.5" /> Excel
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            onClick={handleExportPdf}
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

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 print:hidden">
        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Total Tagihan</div>
            <div className="text-lg sm:text-xl font-bold text-text-main">
              Rp {new Intl.NumberFormat("id-ID").format(filteredData.reduce((acc, curr) => acc + curr.nominal, 0))}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f32] border border-emerald-200/60 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Total Dibayar</div>
            <div className="text-lg sm:text-xl font-bold text-text-main">
              Rp {new Intl.NumberFormat("id-ID").format(filteredData.reduce((acc, curr) => acc + curr.dibayar, 0))}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center justify-center shrink-0">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-rose-700 uppercase tracking-wider mb-0.5">Sisa Tunggakan</div>
            <div className="text-lg sm:text-xl font-black text-rose-800">
              Rp {new Intl.NumberFormat("id-ID").format(matrixRows.reduce((acc, curr) => acc + curr.totalTunggakan, 0))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 print:shadow-none print:border-none print:p-0">
        
        {/* KOP SURAT (Hanya Print) */}
        <PrintHeader 
          pengaturan={pengaturan}
          unitInfo={filterUnitId ? schoolUnits.find(u => u.id === filterUnitId) : undefined} 
        />

        {/* Document Header untuk Print */}
        <div className="hidden print:block text-center mb-6">
          <h2 className="text-xl font-bold text-black uppercase mb-1">LAPORAN TUNGGAKAN SISWA</h2>
          <div className="text-sm font-medium text-gray-800">Data {unitName}</div>
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
              <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-500 text-xs uppercase tracking-wider bg-bg/50">
                    <th className="p-3 font-semibold text-center w-12 border-r border-border/50" rowSpan={2}>NO</th>
                    <th className="p-3 font-semibold border-r border-border/50" rowSpan={2}>NIS</th>
                    <th className="p-3 font-semibold border-r border-border/50 min-w-[200px]" rowSpan={2}>NAMA SISWA</th>
                    <th className="p-3 font-semibold border-r border-border/50" rowSpan={2}>ROMBEL</th>
                    <th className="p-3 font-semibold text-center border-r border-border/50 bg-primary/5 text-primary" colSpan={3}>SPP</th>
                    {dynamicCategories.length > 0 && (
                      <th className="p-3 font-semibold text-center border-r border-border/50" colSpan={dynamicCategories.length}>TAGIHAN LAINNYA</th>
                    )}
                    <th className="p-3 font-semibold text-right text-rose-600" rowSpan={2}>TOTAL TUNGGAKAN</th>
                  </tr>
                  <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider bg-bg/30">
                    <th className="p-2 text-center font-medium border-r border-border/50 text-primary/80">Bulan</th>
                    <th className="p-2 text-center font-medium border-r border-border/50 text-primary/80">Jml Bln</th>
                    <th className="p-2 text-right font-medium border-r border-border/50 text-primary/80">Nilai SPP</th>
                    {dynamicCategories.map(cat => (
                      <th key={cat} className="p-2 text-right font-medium border-r border-border/50">{cat}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8 + dynamicCategories.length} className="py-12 text-center text-gray-500 italic">
                        Tidak ada data tunggakan.
                      </td>
                    </tr>
                  ) : (
                    <>
                    {paginatedData.map((item, idx) => {
                      const absoluteIdx = (currentPage - 1) * pageSize + idx + 1
                      return (
                        <tr key={item.muridId} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="p-3 text-center border-r border-border/50">{absoluteIdx}</td>
                          <td className="p-3 font-mono font-medium border-r border-border/50">{item.nis}</td>
                          <td className="p-3 font-bold text-gray-700 border-r border-border/50">{item.namaSiswa}</td>
                          <td className="p-3 text-gray-600 border-r border-border/50">{item.rombel}</td>
                          <td className="p-3 text-center text-xs text-primary/80 border-r border-border/50 max-w-[150px] relative group/tooltip cursor-help">
                            <div className="truncate">
                              {item.sppMonthString}
                            </div>
                            {item.sppMonthString !== "-" && (
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 w-max max-w-[250px] bg-slate-800 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl border border-slate-700 whitespace-normal text-center leading-relaxed">
                                <span className="font-semibold block mb-1 text-slate-300 border-b border-slate-600 pb-1">Bulan Tunggakan SPP:</span>
                                {item.sppMonthString.split('/').join(', ')}
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-800 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono border-r border-border/50">{item.sppCount || "-"}</td>
                          <td className="p-3 text-right font-mono font-medium border-r border-border/50">
                            {item.sppAmount > 0 
                              ? <span className="text-primary">{new Intl.NumberFormat("id-ID").format(item.sppAmount)}</span>
                              : (item.sppDibayar > 0 ? <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Lunas</span> : "-")
                            }
                          </td>
                          
                          {dynamicCategories.map(cat => {
                            const detail = item.categories[cat] || { sisa: 0, dibayar: 0 }
                            return (
                              <td key={cat} className="p-3 text-right font-mono text-gray-600 border-r border-border/50">
                                {detail.sisa > 0 
                                  ? new Intl.NumberFormat("id-ID").format(detail.sisa)
                                  : (detail.dibayar > 0 ? <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Lunas</span> : "-")
                                }
                              </td>
                            )
                          })}
                          
                          <td className="p-3 text-right font-mono font-bold text-rose-600 bg-rose-50/30 group-hover:bg-rose-50/50">
                            {new Intl.NumberFormat("id-ID").format(item.totalTunggakan)}
                          </td>
                        </tr>
                      )
                    })}
                    {/* Totals Row */}
                    <tr className="bg-gray-100 font-bold text-gray-800">
                      <td colSpan={4} className="p-3 text-right border-r border-border/50">TOTAL KESELURUHAN</td>
                      <td colSpan={2} className="border-r border-border/50"></td>
                      <td className="p-3 text-right text-primary border-r border-border/50">
                        {new Intl.NumberFormat("id-ID").format(matrixRows.reduce((acc, curr) => acc + curr.sppAmount, 0))}
                      </td>
                      {dynamicCategories.map(cat => (
                        <td key={`total-${cat}`} className="p-3 text-right border-r border-border/50">
                          {new Intl.NumberFormat("id-ID").format(matrixRows.reduce((acc, curr) => acc + (curr.categories[cat]?.sisa || 0), 0))}
                        </td>
                      ))}
                      <td className="p-3 text-right text-rose-700">
                        Rp {new Intl.NumberFormat("id-ID").format(matrixRows.reduce((acc, curr) => acc + curr.totalTunggakan, 0))}
                      </td>
                    </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tanda Tangan (Hanya Print) */}
              <>
                <PrintSignature
                  pengaturan={pengaturan}
                  unitInfo={activeUnit}
                  tipe="ganda"
                  tanggal={new Date()}
                  kiri={getSignatoryKiri(pengaturan, activeUnit)}
                  kanan={{ jabatan: "Petugas Tata Usaha,", nama: activeUnit?.namaKepalaTU || userName || "____________________" }}
                />
                <PrintFooter pengaturan={pengaturan} />
              </>

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

"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Loader2, FileSpreadsheet, FileIcon as FilePdf, RefreshCw, Receipt, CheckCircle2, AlertCircle, TrendingUp, PieChart, Users } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { TabNavigation } from "@/components/ui/TabNavigation"
import { TableScrollHint } from "@/components/ui/TableScrollHint"
import { getRekapitulasiTunggakan } from "@/actions/rekapitulasi-tunggakan"
import { exportTablePdf } from "@/lib/pdf"
import { buildInstitutionInfo, getSignatoryKiri } from "@/lib/pdf-helpers"
import { exportToExcel } from "@/lib/excel"
import { 
  Toolbar, 
  ToolbarSearch, 
  ToolbarFilter, 
  ToolbarActions,
  ToolbarExportExcel,
  ToolbarExportPDF
} from "@/components/ui/DataTableToolbar"
import { AdaptiveValue } from "@/components/ui/AdaptiveValue"
import { PageHeader } from "@/components/ui/PageHeader"

interface Akun {
  id: string
  nama: string
  kode: string
}

interface RekapStudent {
  id: string
  name: string
  nisn: string
  totalTagihan: number
  totalDibayar: number
  totalTunggakan: number
  detailKomponen: Record<string, { tagihan: number, dibayar: number, tunggakan: number }>
}

interface RekapItem {
  subKelasId: string
  subKelasName: string
  totalTagihan: number
  totalDibayar: number
  totalTunggakan: number
  detailKomponen: Record<string, { tagihan: number, dibayar: number, tunggakan: number }>
  studentsList?: RekapStudent[]
}

interface Props {
  activeUnitId: string
  activeUnitName?: string
  activeTahunAkademikId: string
  activeTahunAkademikName: string
  pengaturan?: any
  unitInfo?: any
  userName?: string
  userRole?: string
}

export default function RekapitulasiTunggakanClient({
  activeUnitId,
  activeUnitName = "SEMUA UNIT",
  activeTahunAkademikId,
  activeTahunAkademikName,
  pengaturan,
  unitInfo,
  userName,
  userRole
}: Props) {
  const isExecutive = userRole === "KEPALA_SEKOLAH" || userRole === "YAYASAN" || userRole === "ADMIN"
  const isGlobal = activeUnitId === "all" || !activeUnitId

  const [isLoading, setIsLoading] = useState(false)
  const [rekapData, setRekapData] = useState<RekapItem[]>([])
  const [akunList, setAkunList] = useState<Akun[]>([])
  const [searchTerm1, setSearchTerm1] = useState("")
  const [searchTerm2, setSearchTerm2] = useState("")
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'detail'>('ringkasan')
  const [selectedSubKelasId, setSelectedSubKelasId] = useState("")
  const [studentSearch, setStudentSearch] = useState("")
  const [detailCurrentPage, setDetailCurrentPage] = useState(1)
  const [detailPageSize, setDetailPageSize] = useState(10)

  const executiveMetrics = useMemo(() => {
    const totalTagihan = rekapData.reduce((sum, r) => sum + (r.totalTagihan || 0), 0)
    const totalDibayar = rekapData.reduce((sum, r) => sum + (r.totalDibayar || 0), 0)
    const totalTunggakan = rekapData.reduce((sum, r) => sum + (r.totalTunggakan || 0), 0)
    const pctKolektibilitas = totalTagihan > 0 ? Math.round((totalDibayar / totalTagihan) * 100) : 0
    
    const topTunggakanRombel = [...rekapData]
      .filter(r => r.totalTunggakan > 0)
      .sort((a, b) => b.totalTunggakan - a.totalTunggakan)
      .slice(0, 3)

    return {
      totalTagihan,
      totalDibayar,
      totalTunggakan,
      pctKolektibilitas,
      topTunggakanRombel
    }
  }, [rekapData])

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
        if (res.data.length > 0 && !selectedSubKelasId) {
          setSelectedSubKelasId(res.data[0].subKelasId)
        }
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

  const selectedKelasData = useMemo(() => {
    return rekapData.find(r => r.subKelasId === selectedSubKelasId)
  }, [rekapData, selectedSubKelasId])

  const filteredStudents = useMemo(() => {
    if (!selectedKelasData || !selectedKelasData.studentsList) return []
    if (!studentSearch.trim()) return selectedKelasData.studentsList
    const q = studentSearch.toLowerCase()
    return selectedKelasData.studentsList.filter(s => 
      s.name.toLowerCase().includes(q) || s.nisn.toLowerCase().includes(q)
    )
  }, [selectedKelasData, studentSearch])

  const totalDetailPages = Math.ceil(filteredStudents.length / detailPageSize) || 1

  const paginatedStudents = useMemo(() => {
    const start = (detailCurrentPage - 1) * detailPageSize
    return filteredStudents.slice(start, start + detailPageSize)
  }, [filteredStudents, detailCurrentPage, detailPageSize])

  const handleExportPdfRingkasan = () => {
    if (filteredData1.length === 0) return toast.error("Tidak ada data untuk diekspor")
    
    const headers = ["NO", "KELAS", "TOTAL TAGIHAN", "TOTAL DIBAYAR", "TOTAL TUNGGAKAN BERJALAN", "TOTAL TUNGGAKAN KESELURUHAN"]
    const data = filteredData1.map((r, i) => [
      (i + 1).toString(),
      r.subKelasName.toUpperCase(),
      `Rp ${formatRupiah(r.totalTagihan)}`,
      `Rp ${formatRupiah(r.totalDibayar)}`,
      `Rp ${formatRupiah(r.totalTunggakan)}`,
      `Rp ${formatRupiah(r.totalTunggakan)}`
    ])
    
    // Add total row
    data.push([
      "",
      "TOTAL KESELURUHAN",
      `Rp ${formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalTagihan, 0))}`,
      `Rp ${formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalDibayar, 0))}`,
      `Rp ${formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalTunggakan, 0))}`,
      `Rp ${formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalTunggakan, 0))}`
    ])

    exportTablePdf({
      institutionInfo: buildInstitutionInfo(pengaturan, unitInfo),
      title: "RINGKASAN TAGIHAN & TUNGGAKAN",
      subtitle: `Unit: ${activeUnitName} • Tahun Akademik: ${activeTahunAkademikName}`,
      headers,
      data,
      filename: `Ringkasan_Tunggakan_${activeUnitName}`,
      config: { orientation: 'landscape' },
      penandatanganKiri: getSignatoryKiri(pengaturan, unitInfo),
      penandatanganKanan: { jabatan: "Petugas Tata Usaha,", nama: unitInfo?.namaKepalaTU || userName || "____________________" }
    })
  }

  const handleExportExcelRingkasan = () => {
    if (filteredData1.length === 0) return toast.error("Tidak ada data untuk diekspor")
    
    const data = filteredData1.map((r, i) => ({
      "NO": i + 1,
      "UNIT": activeUnitName,
      "KELAS": r.subKelasName.toUpperCase(),
      "TOTAL TAGIHAN": r.totalTagihan,
      "TOTAL DIBAYAR": r.totalDibayar,
      "TOTAL TUNGGAKAN": r.totalTunggakan
    }))
    
    exportToExcel(data, `Ringkasan_Tunggakan_${activeUnitName}`, {
      title: "Ringkasan Tagihan & Tunggakan",
      unitInfo: unitInfo || pengaturan
    })
  }

  const handleExportPdfDetail = () => {
    if (filteredData2.length === 0) return toast.error("Tidak ada data untuk diekspor")
    
    const headers = ["NO", "KELAS", ...akunList.map(a => a.nama.toUpperCase())]
    const data = filteredData2.map((r, i) => {
      const rowData = [
        (i + 1).toString(),
        r.subKelasName.toUpperCase(),
      ]
      akunList.forEach(akun => {
        const val = r.detailKomponen[akun.id]?.tunggakan || 0
        rowData.push(`Rp ${formatRupiah(val)}`)
      })
      return rowData
    })
    
    // Add total row
    const totalRow = ["", "TOTAL KESELURUHAN"]
    akunList.forEach(akun => {
      const colTotal = filteredData2.reduce((acc, r) => acc + (r.detailKomponen[akun.id]?.tunggakan || 0), 0)
      totalRow.push(`Rp ${formatRupiah(colTotal)}`)
    })
    data.push(totalRow)

    exportTablePdf({
      institutionInfo: buildInstitutionInfo(pengaturan, unitInfo),
      title: "DETAIL TUNGGAKAN PER KOMPONEN",
      subtitle: `Unit: ${activeUnitName} • Tahun Akademik: ${activeTahunAkademikName}`,
      headers,
      data,
      filename: `Detail_Tunggakan_${activeUnitName}`,
      config: { orientation: 'landscape' },
      penandatanganKiri: getSignatoryKiri(pengaturan, unitInfo),
      penandatanganKanan: { jabatan: "Petugas Tata Usaha,", nama: unitInfo?.namaKepalaTU || userName || "____________________" }
    })
  }

  const handleExportExcelDetail = () => {
    if (filteredData2.length === 0) return toast.error("Tidak ada data untuk diekspor")
    
    const data = filteredData2.map((r, i) => {
      const rowData: any = {
        "NO": i + 1,
        "UNIT": activeUnitName,
        "KELAS": r.subKelasName.toUpperCase(),
      }
      akunList.forEach(akun => {
        const val = r.detailKomponen[akun.id]?.tunggakan || 0
        rowData[akun.nama.toUpperCase()] = val
      })
      return rowData
    })
    
    exportToExcel(data, `Detail_Tunggakan_${activeUnitName}`, {
      title: "Detail Tunggakan per Siswa",
      unitInfo: unitInfo || pengaturan
    })
  }

  const handleExportPdfKelas = () => {
    if (!selectedKelasData || filteredStudents.length === 0) return toast.error("Tidak ada data untuk diekspor")
    
    const headers = ["NO", "NAMA SISWA", "NISN", "TOTAL TAGIHAN", "TOTAL DIBAYAR", "SISA TUNGGAKAN"]
    const data = filteredStudents.map((r, i) => [
      (i + 1).toString(),
      r.name.toUpperCase(),
      r.nisn,
      `Rp ${formatRupiah(r.totalTagihan)}`,
      `Rp ${formatRupiah(r.totalDibayar)}`,
      `Rp ${formatRupiah(r.totalTunggakan)}`
    ])
    
    // Add total row
    data.push([
      "",
      "TOTAL KESELURUHAN",
      "",
      `Rp ${formatRupiah(filteredStudents.reduce((acc, r) => acc + r.totalTagihan, 0))}`,
      `Rp ${formatRupiah(filteredStudents.reduce((acc, r) => acc + r.totalDibayar, 0))}`,
      `Rp ${formatRupiah(filteredStudents.reduce((acc, r) => acc + r.totalTunggakan, 0))}`
    ])

    exportTablePdf({
      institutionInfo: buildInstitutionInfo(pengaturan, unitInfo),
      title: `DETAIL TUNGGAKAN KELAS ${selectedKelasData.subKelasName.toUpperCase()}`,
      subtitle: `Unit: ${activeUnitName} • Tahun Akademik: ${activeTahunAkademikName}`,
      headers,
      data,
      filename: `Tunggakan_Kelas_${selectedKelasData.subKelasName}_${activeUnitName}`,
      config: { orientation: 'portrait' },
      penandatanganKiri: getSignatoryKiri(pengaturan, unitInfo),
      penandatanganKanan: { jabatan: "Petugas Tata Usaha,", nama: unitInfo?.namaKepalaTU || userName || "____________________" }
    })
  }

  const handleExportExcelKelas = () => {
    if (!selectedKelasData || filteredStudents.length === 0) return toast.error("Tidak ada data untuk diekspor")
    
    const data = filteredStudents.map((r, i) => {
      const rowData: any = {
        "NO": i + 1,
        "NAMA SISWA": r.name.toUpperCase(),
        "NISN": r.nisn,
        "TOTAL TAGIHAN": r.totalTagihan,
        "TOTAL DIBAYAR": r.totalDibayar,
        "SISA TUNGGAKAN": r.totalTunggakan
      }
      akunList.forEach(akun => {
        const val = r.detailKomponen[akun.id]?.tunggakan || 0
        rowData[akun.nama.toUpperCase()] = val
      })
      return rowData
    })
    
    exportToExcel(data, `Tunggakan_Kelas_${selectedKelasData.subKelasName}_${activeUnitName}`, {
      title: `Detail Tunggakan Siswa - Kelas ${selectedKelasData.subKelasName.toUpperCase()}`,
      unitInfo: unitInfo || pengaturan
    })
  }

  return (
    <div className="w-full">
      <PageHeader 
        title="Rekapitulasi Tagihan & Tunggakan"
        subtitle={isGlobal 
          ? `Audit realisasi penerimaan pembayaran, kolektibilitas SPP, dan piutang siswa lintas unit (${activeTahunAkademikName})`
          : `Audit realisasi penerimaan pembayaran, kolektibilitas SPP, dan piutang siswa per kelas (${activeTahunAkademikName})`}
      />

      {/* 4 Card KPI Rekapitulasi Tagihan & Tunggakan (Active for ALL Roles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
              Total Tagihan
            </p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="my-0.5">
              <AdaptiveValue 
                value={`Rp ${formatRupiah(executiveMetrics.totalTagihan)}`}
                className="text-text-main"
                maxFontSize={22}
                minFontSize={12}
              />
            </div>
            <p className="text-[11px] font-medium text-text-muted mt-0.5 truncate">TA {activeTahunAkademikName}</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
              Realisasi Masuk
            </p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="my-0.5">
              <AdaptiveValue 
                value={`Rp ${formatRupiah(executiveMetrics.totalDibayar)}`}
                className="text-emerald-600"
                maxFontSize={22}
                minFontSize={12}
              />
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5 truncate">Kolektibilitas {executiveMetrics.pctKolektibilitas}%</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] sm:text-xs font-semibold text-rose-700 uppercase tracking-wider truncate">
              Sisa Piutang
            </p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="my-0.5">
              <AdaptiveValue 
                value={`Rp ${formatRupiah(executiveMetrics.totalTunggakan)}`}
                className="text-rose-600"
                maxFontSize={22}
                minFontSize={12}
              />
            </div>
            <p className="text-[11px] font-semibold text-rose-600 mt-0.5 truncate">
              {executiveMetrics.totalTunggakan > 0 ? "Belum Tertagih" : "Lunas Terbayar"}
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
              Prioritas Rombel
            </p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="my-0.5">
              <AdaptiveValue 
                value={(executiveMetrics.topTunggakanRombel[0]?.subKelasName || "Semua Lunas").replace(/^\[.*?\]\s*/, '')}
                className="text-text-main"
                maxFontSize={20}
                minFontSize={12}
              />
            </div>
            <p className="text-[11px] font-medium text-amber-600 mt-0.5 truncate">
              {executiveMetrics.topTunggakanRombel[0] 
                ? `Rp ${formatRupiah(executiveMetrics.topTunggakanRombel[0].totalTunggakan)}` 
                : "Nihil Tunggakan"}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 bg-surface rounded-2xl shadow-sm border border-border">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <>
          {/* CARD 1: MAIN CARD */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6 mb-6">
            {/* TAB HEADERS */}
            <TabNavigation
              tabs={[
                { id: 'ringkasan', label: 'Ringkasan Tunggakan', icon: PieChart, badge: rekapData.length },
                { id: 'detail', label: 'Detail Laporan Per Kelas', icon: Users }
              ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as 'ringkasan' | 'detail')}
            />

            {/* TAB CONTENT: RINGKASAN - BAGIAN 1: TABEL RINGKASAN */}
            {activeTab === 'ringkasan' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-text-main">
                      Ringkasan Tunggakan per Kelas
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Akumulasi total tagihan, penerimaan pembayaran, dan sisa tunggakan per rombel
                    </p>
                  </div>
                </div>

                <Toolbar className="flex-col sm:flex-row gap-2.5">
                  <ToolbarSearch 
                    value={searchTerm1}
                    onChange={(e: any) => setSearchTerm1(e.target.value)}
                    placeholder="Cari kelas..." 
                    disabled={rekapData.length === 0}
                    containerClassName="w-full sm:max-w-xs"
                  />
                  
                  <ToolbarActions className="w-full sm:w-auto sm:ml-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadData}
                      title="Refresh Data"
                      className="min-h-[44px]"
                    >
                      <RefreshCw size={16} />
                    </Button>
                    <ToolbarExportExcel 
                      onClick={handleExportExcelRingkasan}
                      disabled={filteredData1.length === 0}
                    />
                    <ToolbarExportPDF 
                      onClick={handleExportPdfRingkasan}
                      disabled={filteredData1.length === 0}
                    />
                  </ToolbarActions>
                </Toolbar>

                <div className="overflow-x-auto min-h-[250px]">
                  <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold text-center w-16">NO</th>
                        <th className="p-4 font-semibold min-w-[250px]">KELAS</th>
                        <th className="p-4 font-semibold text-right">TOTAL TAGIHAN</th>
                        <th className="p-4 font-semibold text-right">TOTAL YANG SUDAH DIBAYAR</th>
                        <th className="p-4 font-semibold text-right">TOTAL TUNGGAKAN BERJALAN</th>
                        <th className="p-4 font-semibold text-right">TOTAL TUNGGAKAN (KESELURUHAN)</th>
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
                          <tr key={row.subKelasId} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                            <td className="p-4 text-center text-text-muted">
                              {idx + 1}
                            </td>
                            <td className="p-4 font-medium text-text-main">
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
                      <tfoot className="bg-bg font-semibold border-t border-border">
                        <tr>
                          <td colSpan={2} className="p-4 text-right text-text-main">
                            TOTAL KESELURUHAN
                          </td>
                          <td className="p-4 text-right text-emerald-700">
                            Rp. {formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalTagihan, 0))}
                          </td>
                          <td className="p-4 text-right text-emerald-700">
                            Rp. {formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalDibayar, 0))}
                          </td>
                          <td className="p-4 text-right text-rose-600">
                            Rp. {formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalTunggakan, 0))}
                          </td>
                          <td className="p-4 text-right text-rose-600">
                            Rp. {formatRupiah(filteredData1.reduce((acc, r) => acc + r.totalTunggakan, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DETAIL LAPORAN */}
            {activeTab === 'detail' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-text-main">
                      Detail Tunggakan Siswa per Kelas
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Rincian status pembayaran dan sisa tunggakan per murid pada rombel terpilih
                    </p>
                  </div>
                </div>

                <Toolbar className="flex-col sm:flex-row gap-2.5">
                  <div className="grid grid-cols-1 sm:flex gap-2.5 w-full sm:w-auto flex-1">
                    <ToolbarFilter
                      value={selectedSubKelasId}
                      onChange={(val) => {
                        setSelectedSubKelasId(val as string)
                        setDetailCurrentPage(1)
                      }}
                      className="w-full sm:w-auto"
                      options={rekapData.map(r => ({ label: `Kelas ${r.subKelasName.toUpperCase()}`, value: r.subKelasId }))}
                    />

                    <ToolbarSearch 
                      value={studentSearch}
                      onChange={(e: any) => {
                        setStudentSearch(e.target.value)
                        setDetailCurrentPage(1)
                      }}
                      onClear={() => {
                        setStudentSearch("")
                        setDetailCurrentPage(1)
                      }}
                      placeholder="Cari nama atau NISN..." 
                      containerClassName="w-full sm:w-72"
                      disabled={!selectedKelasData?.studentsList || selectedKelasData.studentsList.length === 0}
                    />
                  </div>
                  
                  <ToolbarActions className="w-full sm:w-auto sm:ml-auto">
                    <ToolbarExportExcel 
                      onClick={handleExportExcelKelas}
                      disabled={filteredStudents.length === 0}
                    />
                    <ToolbarExportPDF 
                      onClick={handleExportPdfKelas}
                      disabled={filteredStudents.length === 0}
                    />
                  </ToolbarActions>
                </Toolbar>

                <div className="overflow-x-auto min-h-[300px]">
                  <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold text-center w-16">NO</th>
                        <th className="p-4 font-semibold min-w-[250px]">NAMA SISWA</th>
                        <th className="p-4 font-semibold text-right">TOTAL TAGIHAN</th>
                        <th className="p-4 font-semibold text-right">TOTAL DIBAYAR</th>
                        <th className="p-4 font-semibold text-right text-rose-600">TUNGGAKAN</th>
                        {akunList.map(akun => (
                          <th key={akun.id} className="p-4 font-semibold text-right opacity-70">{akun.nama.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5 + akunList.length} className="p-8 text-center text-text-muted">
                            {!selectedSubKelasId || !selectedKelasData?.studentsList || selectedKelasData.studentsList.length === 0
                              ? "Tidak ada data siswa untuk kelas ini."
                              : "Tidak ada siswa yang sesuai pencarian."}
                          </td>
                        </tr>
                      ) : (
                        paginatedStudents.map((student, idx) => {
                          const itemIndex = (detailCurrentPage - 1) * detailPageSize + idx + 1
                          return (
                            <tr key={student.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                              <td className="p-4 text-center text-text-muted">
                                {itemIndex}
                              </td>
                              <td className="p-4">
                                <p className="font-medium text-text-main">{student.name}</p>
                                <p className="text-xs text-text-muted">{student.nisn}</p>
                              </td>
                              <td className="p-4 text-right font-medium">Rp. {formatRupiah(student.totalTagihan)}</td>
                              <td className="p-4 text-right font-medium">Rp. {formatRupiah(student.totalDibayar)}</td>
                              <td className="p-4 text-right font-bold text-rose-600">Rp. {formatRupiah(student.totalTunggakan)}</td>
                              {akunList.map(akun => {
                                const detail = student.detailKomponen[akun.id]
                                const tunggakan = detail?.tunggakan || 0
                                const dibayar = detail?.dibayar || 0
                                return (
                                  <td key={akun.id} className="p-4 text-right font-medium opacity-80">
                                    {tunggakan > 0 
                                      ? `Rp. ${formatRupiah(tunggakan)}` 
                                      : (dibayar > 0 ? <span className="text-emerald-600 font-semibold text-xs">LUNAS</span> : "-")}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                    {filteredStudents.length > 0 && (
                      <tfoot className="bg-bg font-semibold border-t border-border">
                        <tr>
                          <td colSpan={2} className="p-4 text-right text-text-main">
                            TOTAL KESELURUHAN ({filteredStudents.length} SISWA)
                          </td>
                          <td className="p-4 text-right text-emerald-700">
                            Rp. {formatRupiah(filteredStudents.reduce((acc, s) => acc + s.totalTagihan, 0))}
                          </td>
                          <td className="p-4 text-right text-emerald-700">
                            Rp. {formatRupiah(filteredStudents.reduce((acc, s) => acc + s.totalDibayar, 0))}
                          </td>
                          <td className="p-4 text-right text-rose-600">
                            Rp. {formatRupiah(filteredStudents.reduce((acc, s) => acc + s.totalTunggakan, 0))}
                          </td>
                          {akunList.map(akun => {
                            const colTotal = filteredStudents.reduce((acc, s) => acc + (s.detailKomponen[akun.id]?.tunggakan || 0), 0)
                            return (
                              <td key={akun.id} className="p-4 text-right text-rose-600 opacity-80">
                                Rp. {formatRupiah(colTotal)}
                              </td>
                            )
                          })}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredStudents.length > 0 && (
                  <div className="pt-4 mt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-muted">Tampilkan:</span>
                      <select
                        value={detailPageSize}
                        onChange={(e) => {
                          setDetailPageSize(Number(e.target.value))
                          setDetailCurrentPage(1)
                        }}
                        className="px-3 py-1.5 bg-bg border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50"
                      >
                        {[10, 25, 50, 100].map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                      <span className="text-xs text-text-muted">
                        Total {filteredStudents.length} siswa
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailCurrentPage(p => Math.max(1, p - 1))}
                        disabled={detailCurrentPage === 1}
                      >
                        Sebelumnya
                      </Button>
                      <span className="font-medium text-text-muted text-sm">
                        Hal {detailCurrentPage} dari {totalDetailPages}
                      </span>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailCurrentPage(p => Math.min(totalDetailPages, p + 1))}
                        disabled={detailCurrentPage === totalDetailPages || totalDetailPages === 0}
                      >
                        Berikutnya
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CARD 2: DETAIL TUNGGAKAN PER KOMPONEN (HANYA MUNCUL DI TAB RINGKASAN) */}
          {activeTab === 'ringkasan' && (
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-text-main">
                    Detail Tunggakan per Komponen Biaya
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Rincian sisa tunggakan kelas dipecah berdasarkan komponen akun pendapatan
                  </p>
                </div>
              </div>

              <Toolbar>
                <ToolbarSearch 
                  value={searchTerm2}
                  onChange={(e: any) => setSearchTerm2(e.target.value)}
                  placeholder="Cari kelas..." 
                  disabled={rekapData.length === 0}
                />
                
                <ToolbarActions>
                  <ToolbarExportExcel 
                    onClick={handleExportExcelDetail}
                    disabled={filteredData2.length === 0}
                  />
                  <ToolbarExportPDF 
                    onClick={handleExportPdfDetail}
                    disabled={filteredData2.length === 0}
                  />
                </ToolbarActions>
              </Toolbar>

              <div className="overflow-x-auto min-h-[250px]">
                <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold text-center w-16">NO</th>
                      <th className="p-4 font-semibold min-w-[250px]">KELAS</th>
                      {akunList.map(akun => (
                        <th key={akun.id} className="p-4 font-semibold text-right">{akun.nama.toUpperCase()}</th>
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
                        <tr key={row.subKelasId} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                          <td className="p-4 text-center text-text-muted">
                            {idx + 1}
                          </td>
                          <td className="p-4 font-medium text-text-main">
                            {row.subKelasName.toUpperCase()}
                          </td>
                          
                          {akunList.map(akun => {
                            const detail = row.detailKomponen[akun.id]
                            const tunggakan = detail?.tunggakan || 0
                            const dibayar = detail?.dibayar || 0
                            return (
                              <td key={akun.id} className="p-4 text-right font-medium opacity-80">
                                {tunggakan > 0 
                                  ? `Rp. ${formatRupiah(tunggakan)}` 
                                  : (dibayar > 0 ? <span className="text-emerald-600 font-semibold text-xs">LUNAS</span> : "-")}
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredData2.length > 0 && (
                    <tfoot className="bg-bg font-semibold border-t border-border">
                      <tr>
                        <td colSpan={2} className="p-4 text-right text-text-main">
                          TOTAL KESELURUHAN
                        </td>
                        
                        {akunList.map(akun => {
                          const colTotal = filteredData2.reduce((acc, r) => acc + (r.detailKomponen[akun.id]?.tunggakan || 0), 0)
                          return (
                            <td key={akun.id} className="p-4 text-right text-rose-600 opacity-80">
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
          )}
        </>
      )}
    </div>
  )
}

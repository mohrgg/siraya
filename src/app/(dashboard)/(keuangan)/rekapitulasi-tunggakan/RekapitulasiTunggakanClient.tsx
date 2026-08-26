"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Loader2, FileSpreadsheet, FileIcon as FilePdf, RefreshCw } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { getRekapitulasiTunggakan } from "@/actions/rekapitulasi-tunggakan"
import { exportTablePdf } from "@/lib/pdf"
import { buildInstitutionInfo } from "@/lib/pdf-helpers"
import { exportToExcel } from "@/lib/excel"
import { 
  Toolbar, 
  ToolbarSearch, 
  ToolbarFilter, 
  ToolbarActions,
  ToolbarExportExcel,
  ToolbarExportPDF
} from "@/components/ui/DataTableToolbar"

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
}

export default function RekapitulasiTunggakanClient({
  activeUnitId,
  activeUnitName = "SEMUA UNIT",
  activeTahunAkademikId,
  activeTahunAkademikName,
  pengaturan,
  unitInfo,
  userName
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [rekapData, setRekapData] = useState<RekapItem[]>([])
  const [akunList, setAkunList] = useState<Akun[]>([])
  const [searchTerm1, setSearchTerm1] = useState("")
  const [searchTerm2, setSearchTerm2] = useState("")
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'detail'>('ringkasan')
  const [selectedSubKelasId, setSelectedSubKelasId] = useState("")

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
      penandatanganKiri: { jabatan: "Mengetahui,", nama: unitInfo?.namaKepalaSekolah || "____________________" },
      penandatanganKanan: { jabatan: "Petugas,", nama: userName || "____________________" }
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
      penandatanganKiri: { jabatan: "Mengetahui,", nama: unitInfo?.namaKepalaSekolah || "____________________" },
      penandatanganKanan: { jabatan: "Petugas,", nama: userName || "____________________" }
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
    if (!selectedKelasData || !selectedKelasData.studentsList || selectedKelasData.studentsList.length === 0) return toast.error("Tidak ada data untuk diekspor")
    
    const headers = ["NO", "NAMA SISWA", "NISN", "TOTAL TAGIHAN", "TOTAL DIBAYAR", "SISA TUNGGAKAN"]
    const data = selectedKelasData.studentsList.map((r, i) => [
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
      `Rp ${formatRupiah(selectedKelasData.studentsList.reduce((acc, r) => acc + r.totalTagihan, 0))}`,
      `Rp ${formatRupiah(selectedKelasData.studentsList.reduce((acc, r) => acc + r.totalDibayar, 0))}`,
      `Rp ${formatRupiah(selectedKelasData.studentsList.reduce((acc, r) => acc + r.totalTunggakan, 0))}`
    ])

    exportTablePdf({
      institutionInfo: buildInstitutionInfo(pengaturan, unitInfo),
      title: `DETAIL TUNGGAKAN KELAS ${selectedKelasData.subKelasName.toUpperCase()}`,
      subtitle: `Unit: ${activeUnitName} • Tahun Akademik: ${activeTahunAkademikName}`,
      headers,
      data,
      filename: `Tunggakan_Kelas_${selectedKelasData.subKelasName}_${activeUnitName}`,
      config: { orientation: 'portrait' },
      penandatanganKiri: { jabatan: "Mengetahui,", nama: unitInfo?.namaKepalaSekolah || "____________________" },
      penandatanganKanan: { jabatan: "Petugas,", nama: userName || "____________________" }
    })
  }

  const handleExportExcelKelas = () => {
    if (!selectedKelasData || !selectedKelasData.studentsList || selectedKelasData.studentsList.length === 0) return toast.error("Tidak ada data untuk diekspor")
    
    const data = selectedKelasData.studentsList.map((r, i) => {
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
          {/* TAB HEADERS */}
          <div className="bg-surface rounded-t-2xl shadow-sm border border-border border-b-0 px-4 sm:px-6 pt-2">
            <div className="flex gap-2 border-b border-border">
              <button 
                onClick={() => setActiveTab('ringkasan')}
                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'ringkasan' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main hover:border-border'}`}
              >
                Ringkasan Tagihan & Tunggakan
              </button>
              <button 
                onClick={() => setActiveTab('detail')}
                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'detail' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main hover:border-border'}`}
              >
                Detail Laporan Per Kelas
              </button>
            </div>
          </div>

          <div className="bg-surface rounded-b-2xl shadow-sm border border-border p-4 sm:p-6 mb-6">
            {activeTab === 'ringkasan' && (
              <div className="flex flex-col gap-8">
                {/* BAGIAN 1: TABEL RINGKASAN */}
                <div>
                  <div className="flex gap-2 mb-6 border-b border-border">
                    <h3 className="px-2 py-3 font-semibold text-lg text-text-main">
                      Ringkasan Tunggakan Kelas
                    </h3>
                  </div>

                  <Toolbar>
                    <ToolbarSearch 
                      value={searchTerm1}
                      onChange={(e: any) => setSearchTerm1(e.target.value)}
                      placeholder="Cari kelas..." 
                      disabled={rekapData.length === 0}
                    />
                    
                    <ToolbarActions>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadData}
                        title="Refresh Data"
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

                  <div className="overflow-x-auto min-h-[300px]">
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

                {/* BAGIAN 2: DETAIL KOMPONEN */}
                <div>
                  <div className="flex gap-2 mb-6 border-b border-border">
                    <h3 className="px-2 py-3 font-semibold text-lg text-text-main">
                      Detail Tunggakan per Komponen
                    </h3>
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

                  <div className="overflow-x-auto min-h-[300px]">
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
                                const val = row.detailKomponen[akun.id]?.tunggakan || 0
                                return (
                                  <td key={akun.id} className="p-4 text-right font-medium opacity-80">
                                    {val > 0 ? `Rp. ${formatRupiah(val)}` : "-"}
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
              </div>
            )}

            {activeTab === 'detail' && (
              <div className="flex flex-col gap-6">
                <Toolbar>
                  <ToolbarFilter
                    value={selectedSubKelasId}
                    onChange={(val) => setSelectedSubKelasId(val as string)}
                    options={rekapData.map(r => ({ label: `Kelas ${r.subKelasName.toUpperCase()}`, value: r.subKelasId }))}
                  />
                  
                  <ToolbarActions>
                    <ToolbarExportExcel 
                      onClick={handleExportExcelKelas}
                      disabled={!selectedKelasData || !selectedKelasData.studentsList || selectedKelasData.studentsList.length === 0}
                    />
                    <ToolbarExportPDF 
                      onClick={handleExportPdfKelas}
                      disabled={!selectedKelasData || !selectedKelasData.studentsList || selectedKelasData.studentsList.length === 0}
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
                      {(!selectedSubKelasId || !selectedKelasData?.studentsList || selectedKelasData.studentsList.length === 0) ? (
                        <tr>
                          <td colSpan={5 + akunList.length} className="p-8 text-center text-text-muted">
                            Tidak ada data siswa untuk kelas ini.
                          </td>
                        </tr>
                      ) : (
                        selectedKelasData.studentsList.map((student, idx) => (
                          <tr key={student.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                            <td className="p-4 text-center text-text-muted">
                              {idx + 1}
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-text-main">{student.name}</p>
                              <p className="text-xs text-text-muted">{student.nisn}</p>
                            </td>
                            <td className="p-4 text-right font-medium">Rp. {formatRupiah(student.totalTagihan)}</td>
                            <td className="p-4 text-right font-medium">Rp. {formatRupiah(student.totalDibayar)}</td>
                            <td className="p-4 text-right font-bold text-rose-600">Rp. {formatRupiah(student.totalTunggakan)}</td>
                            {akunList.map(akun => {
                              const val = student.detailKomponen[akun.id]?.tunggakan || 0
                              return (
                                <td key={akun.id} className="p-4 text-right font-medium opacity-80">
                                  {val > 0 ? `Rp. ${formatRupiah(val)}` : "-"}
                                </td>
                              )
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                    {selectedKelasData && selectedKelasData.studentsList && selectedKelasData.studentsList.length > 0 && (
                      <tfoot className="bg-bg font-semibold border-t border-border">
                        <tr>
                          <td colSpan={2} className="p-4 text-right text-text-main">
                            TOTAL KESELURUHAN
                          </td>
                          <td className="p-4 text-right text-emerald-700">
                            Rp. {formatRupiah(selectedKelasData.studentsList.reduce((acc, s) => acc + s.totalTagihan, 0))}
                          </td>
                          <td className="p-4 text-right text-emerald-700">
                            Rp. {formatRupiah(selectedKelasData.studentsList.reduce((acc, s) => acc + s.totalDibayar, 0))}
                          </td>
                          <td className="p-4 text-right text-rose-600">
                            Rp. {formatRupiah(selectedKelasData.studentsList.reduce((acc, s) => acc + s.totalTunggakan, 0))}
                          </td>
                          {akunList.map(akun => {
                            const colTotal = selectedKelasData.studentsList!.reduce((acc, s) => acc + (s.detailKomponen[akun.id]?.tunggakan || 0), 0)
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
          </div>
        </>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { getMutasiBank } from "@/actions/laporan"
import { Calendar as CalendarIcon, ArrowLeft, Printer, Search, RefreshCw, FileText, FileSpreadsheet, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { exportToExcel } from "@/lib/excel"
import { exportMutasiBankPdf } from "@/lib/pdf"
import { buildInstitutionInfo } from "@/lib/pdf-helpers"
import toast from "react-hot-toast"
import PrintHeader from "@/components/shared/print/PrintHeader"
import PrintSignature from "@/components/shared/print/PrintSignature"
import PrintFooter from "@/components/shared/print/PrintFooter"

export default function LaporanMutasiBankClient({ pengaturan, schoolUnits = [], akunKasBank = [], userRole, userUnitId, userName, isGlobal }: { pengaturan?: any, schoolUnits?: any[], akunKasBank?: any[], userRole?: string, userUnitId?: string, userName?: string, isGlobal?: boolean }) {
  const router = useRouter()
  
  const filterUnitId = userUnitId || ""
  const unitName = filterUnitId ? (schoolUnits?.find(u => u.id === filterUnitId)?.name || "UNIT") : "YAYASAN"

  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<{
    saldoAwal: number,
    mutasi: any[],
    saldoAkhir: number
  } | null>(null)

  // Default to first bank account if available
  const [selectedAkunId, setSelectedAkunId] = useState(akunKasBank[0]?.id || "")

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
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
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

    const formatDate = (d: Date) => {
      const offset = d.getTimezoneOffset()
      const localDate = new Date(d.getTime() - (offset*60*1000))
      return localDate.toISOString().split('T')[0]
    }

    return { startDate: formatDate(start), endDate: formatDate(end) }
  }

  const fetchData = async () => {
    if (!selectedAkunId) return
    setIsLoading(true)
    try {
      const { startDate, endDate } = getDates(dateRange)
      const res = await getMutasiBank(startDate, endDate, selectedAkunId)
      setData(res)
    } catch (error: any) {
      toast.error("Gagal mengambil mutasi bank: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Also re-fetch if account changes
    fetchData()
  }, [dateRange, filterUnitId, selectedAkunId])

  const { startDate, endDate } = getDates(dateRange)
  const selectedAkunName = akunKasBank.find(a => a.id === selectedAkunId)?.nama || "Akun"

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    if (!data) return
    const filename = `Mutasi_Kas_${selectedAkunName.replace(/\s+/g, '_')}_${startDate}`
    
    const excelData: any[] = []
    
    // Saldo Awal row
    excelData.push({
      "Tanggal": startDate,
      "No. Referensi": "-",
      "Keterangan": "Saldo Awal",
      "Pihak Ketiga": "-",
      "Pemasukan (Debit)": 0,
      "Pengeluaran (Kredit)": 0,
      "Saldo": data.saldoAwal
    })

    // Mutasi
    data.mutasi.forEach((m: any) => {
      excelData.push({
        "Tanggal": new Date(m.tanggal).toLocaleDateString('id-ID'),
        "No. Referensi": m.noReferensi,
        "Keterangan": m.keterangan,
        "Pihak Ketiga": m.pihakKetiga,
        "Pemasukan (Debit)": m.debit,
        "Pengeluaran (Kredit)": m.kredit,
        "Saldo": m.saldo
      })
    })
    
    // Total Saldo Akhir (opsional)

    exportToExcel(excelData, filename)
  }

  const handleExportPdf = () => {
    if (!data) return
    
    const instInfo = buildInstitutionInfo(pengaturan, unitName)
    const filename = `Mutasi_Kas_${selectedAkunName.replace(/\s+/g, '_')}_${startDate}.pdf`
    
    exportMutasiBankPdf({
      data,
      institutionInfo: instInfo,
      dateRangeStr: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
      accountName: selectedAkunName,
      filename,
      penandatanganKiri: { jabatan: "Mengetahui,", nama: pengaturan?.namaKepalaTU || "____________________" },
      penandatanganKanan: { jabatan: "Petugas,", nama: userName || "____________________" }
    })
    
    toast.success("PDF berhasil diunduh")
  }

  const totalDebit = data?.mutasi.reduce((acc, curr) => acc + curr.debit, 0) || 0
  const totalKredit = data?.mutasi.reduce((acc, curr) => acc + curr.kredit, 0) || 0

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Mutasi Kas / Bank</h1>
          <p className="text-text-muted">Laporan rincian pemasukan dan pengeluaran pada satu akun Kas/Bank</p>
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
            disabled={!data || data.mutasi.length === 0}
          >
            <FileSpreadsheet size={16} className="mr-1.5" /> Excel
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            onClick={handleExportPdf}
            className="opacity-100 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 shadow-sm"
            disabled={!data || data.mutasi.length === 0}
          >
            <FileText size={16} className="mr-1.5" /> PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint} 
            className="font-semibold bg-surface shadow-sm border-gray-200 text-gray-700 hover:bg-gray-50"
            disabled={!data || data.mutasi.length === 0}
          >
            <Printer size={16} className="mr-1.5" /> Cetak
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-surface p-5 rounded-2xl shadow-sm border border-border mb-6 print:hidden">
        <div className="text-sm font-semibold text-gray-600 mb-2">Pilih Rekening & Periode Laporan</div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          <div className="flex items-center w-full md:w-auto border border-border rounded-lg overflow-hidden bg-gray-50 flex-1 max-w-md">
            <div className="px-3 text-blue-500 shrink-0 border-r border-border bg-blue-50 h-full flex items-center justify-center">
              <Wallet size={16} />
            </div>
            <select 
              value={selectedAkunId} 
              onChange={(e) => setSelectedAkunId(e.target.value)}
              className="w-full bg-transparent border-none py-2.5 px-3 text-sm font-medium focus:ring-0 cursor-pointer text-text-main"
            >
              {akunKasBank.length === 0 && <option value="">Belum ada akun bank...</option>}
              {akunKasBank.map((a: any) => (
                <option key={a.id} value={a.id}>{a.kode} - {a.nama} {a.unitSekolah ? `(${a.unitSekolah.name})` : ''}</option>
              ))}
            </select>
          </div>

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

          <Button onClick={fetchData} disabled={isLoading || !selectedAkunId} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 shadow-sm gap-2 whitespace-nowrap">
            {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            Terapkan Filter
          </Button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Saldo Awal</div>
            <div className="text-xl font-bold text-gray-800">
              {isLoading ? "..." : `Rp ${(data?.saldoAwal || 0).toLocaleString('id-ID')}`}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center relative z-10">
            <ArrowDownRight size={24} />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-semibold text-emerald-600/80 uppercase tracking-wider mb-1">Pemasukan Periode Ini</div>
            <div className="text-xl font-bold text-emerald-700">
              {isLoading ? "..." : `Rp ${totalDebit.toLocaleString('id-ID')}`}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center relative z-10">
            <ArrowUpRight size={24} />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-semibold text-rose-600/80 uppercase tracking-wider mb-1">Pengeluaran Periode Ini</div>
            <div className="text-xl font-bold text-rose-700">
              {isLoading ? "..." : `Rp ${totalKredit.toLocaleString('id-ID')}`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Print Container */}
      <div className="bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-border print:shadow-none print:border-none print:m-0 print:p-0 p-8">
        <PrintHeader 
          pengaturan={pengaturan}
          unitInfo={filterUnitId ? schoolUnits?.find(u => u.id === filterUnitId) : undefined}
        />

        <div className="text-center mb-10">
          <h2 className="text-xl font-bold uppercase tracking-widest text-gray-800">MUTASI {selectedAkunName.toUpperCase()}</h2>
          <p className="text-sm text-gray-500 mt-1">Periode: {new Date(startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} s/d {new Date(endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
        </div>

        {/* Tabel Mutasi */}
        <div className="p-0 sm:p-6 print:p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap print:text-xs">
              <thead>
                <tr className="border-b-2 border-gray-800 bg-gray-50 text-gray-700 uppercase tracking-wider">
                  <th className="p-3 font-bold print:p-2">TANGGAL</th>
                  <th className="p-3 font-bold print:p-2">NO. REF</th>
                  <th className="p-3 font-bold print:p-2 min-w-[200px]">KETERANGAN</th>
                  <th className="p-3 font-bold text-right print:p-2">DEBIT (MASUK)</th>
                  <th className="p-3 font-bold text-right print:p-2">KREDIT (KELUAR)</th>
                  <th className="p-3 font-bold text-right print:p-2">SALDO</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center p-8 text-gray-500">Memuat mutasi bank...</td></tr>
                ) : (
                  <>
                    <tr className="border-b border-gray-200 bg-gray-50/50 font-semibold">
                      <td colSpan={5} className="p-3 text-right text-gray-600 print:p-2">Saldo Awal:</td>
                      <td className="p-3 text-right text-gray-800 print:p-2">
                        {data ? `Rp ${data.saldoAwal.toLocaleString('id-ID')}` : "-"}
                      </td>
                    </tr>
                    
                    {data?.mutasi.map((m: any, idx: number) => (
                      <tr key={m.id || idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 print:p-2">{new Date(m.tanggal).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 font-mono text-xs text-gray-500 print:p-2">{m.noReferensi}</td>
                        <td className="p-3 print:p-2 whitespace-normal min-w-[200px]">
                          <div>{m.keterangan}</div>
                          {m.pihakKetiga !== "-" && <div className="text-xs text-emerald-600 mt-0.5 font-medium">Mitra/Siswa: {m.pihakKetiga}</div>}
                        </td>
                        <td className="p-3 text-right text-emerald-600 font-medium print:p-2">
                          {m.debit > 0 ? `Rp ${m.debit.toLocaleString('id-ID')}` : "-"}
                        </td>
                        <td className="p-3 text-right text-rose-600 font-medium print:p-2">
                          {m.kredit > 0 ? `Rp ${m.kredit.toLocaleString('id-ID')}` : "-"}
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-800 print:p-2">
                          Rp {m.saldo.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    
                    {data?.mutasi.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 print:p-4">
                          Tidak ada mutasi kas pada periode ini.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
              {!isLoading && data && data.mutasi.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-800 font-bold bg-gray-50 text-gray-800">
                    <td colSpan={3} className="p-3 text-right print:p-2">Total Mutasi & Saldo Akhir:</td>
                    <td className="p-3 text-right text-emerald-700 print:p-2">Rp {totalDebit.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right text-rose-700 print:p-2">Rp {totalKredit.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right text-blue-700 print:p-2">Rp {data.saldoAkhir.toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Print Signatures */}
        <div className="p-6 hidden print:block">
          <PrintSignature
            tipe="ganda"
            tanggal={new Date()}
            kiri={{ jabatan: "Mengetahui,", nama: pengaturan?.namaKepalaTU || "____________________" }}
            kanan={{ jabatan: "Petugas,", nama: userName || "____________________" }}
          />
        </div>

        {/* Print Footer */}
        <PrintFooter />
      </div>
    </div>
  )
}

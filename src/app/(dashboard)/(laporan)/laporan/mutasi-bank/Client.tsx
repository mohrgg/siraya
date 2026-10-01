"use client"

import { useState, useEffect } from "react"
import { getMutasiBank } from "@/actions/laporan"
import { Calendar as CalendarIcon, ArrowLeft, Printer, Search, RefreshCw, FileText, FileSpreadsheet, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { exportToExcel } from "@/lib/excel"
import { exportMutasiBankPdf } from "@/lib/pdf"
import { buildInstitutionInfo, getSignatoryKiri } from "@/lib/pdf-helpers"
import toast from "react-hot-toast"
import PrintHeader from "@/components/shared/print/PrintHeader"
import PrintSignature from "@/components/shared/print/PrintSignature"
import PrintFooter from "@/components/shared/print/PrintFooter"
import { PageHeader } from "@/components/ui/PageHeader"
import { 
  ToolbarRefreshButton,
  ToolbarExportExcel, 
  ToolbarExportPDF, 
  ToolbarPrintButton,
  ToolbarFilter
} from "@/components/ui/DataTableToolbar"

export default function LaporanMutasiBankClient({ pengaturan, schoolUnits = [], akunKasBank = [], userRole, userUnitId, userName, isGlobal }: { pengaturan?: any, schoolUnits?: any[], akunKasBank?: any[], userRole?: string, userUnitId?: string, userName?: string, isGlobal?: boolean }) {
  const router = useRouter()
  
  const filterUnitId = userUnitId || ""
  const selectedUnit = filterUnitId ? schoolUnits?.find(u => u.id === filterUnitId) : undefined
  const unitName = selectedUnit ? selectedUnit.name : "YAYASAN"

  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<{
    saldoAwal: number,
    mutasi: any[],
    saldoAkhir: number
  } | null>(null)

  // Default to first bank account if available
  const [selectedAkunId, setSelectedAkunId] = useState(akunKasBank[0]?.id || "")

  // Default to today
  const [dateRange, setDateRange] = useState("Hari Ini")
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0])
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0])

  const getDates = (range: string) => {
    const now = new Date()
    let start = new Date()
    let end = new Date()

    if (range === "Semua Waktu") {
      start = new Date(2020, 0, 1)
      end = new Date(now.getFullYear() + 1, 11, 31)
    } else if (range === "Hari Ini") {
      start = new Date(now)
      end = new Date(now)
    } else if (range === "Minggu Ini") {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      start = new Date(now.setDate(diff))
      end = new Date()
    } else if (range === "Bulan Ini") {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (range === "Bulan Lalu") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
    } else if (range === "Tahun Ini") {
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31)
    } else if (range === "Kustom") {
      return { startDate: customStart, endDate: customEnd }
    }

    const toYYYYMMDD = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return { startDate: toYYYYMMDD(start), endDate: toYYYYMMDD(end) }
  }

  const fetchData = async () => {
    if (!selectedAkunId) return
    setIsLoading(true)
    try {
      const { startDate, endDate } = getDates(dateRange)
      const res = await getMutasiBank(startDate, endDate, selectedAkunId)
      setData(res)
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil data mutasi")
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
    const instInfo = buildInstitutionInfo(pengaturan, selectedUnit)
    const filename = `Mutasi_Kas_${selectedAkunName.replace(/\s+/g, '_')}_${startDate}.pdf`
    
    exportMutasiBankPdf({
      data,
      institutionInfo: instInfo,
      dateRangeStr: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
      accountName: selectedAkunName,
      filename,
      penandatanganKiri: getSignatoryKiri(pengaturan, selectedUnit),
      penandatanganKanan: { jabatan: "Bendahara,", nama: selectedUnit?.namaBendaharaUnit || pengaturan?.namaBendaharaYayasan || userName || "____________________" }
    })
    
    toast.success("PDF berhasil diunduh")
  }

  const totalDebit = data?.mutasi.reduce((acc, curr) => acc + curr.debit, 0) || 0
  const totalKredit = data?.mutasi.reduce((acc, curr) => acc + curr.kredit, 0) || 0

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      <PageHeader
        className="print:hidden"
        backHref="/laporan"
        backLabel="Kembali ke Menu Laporan"
        backShortLabel="Kembali"
        title="Mutasi Kas / Bank"
        subtitle="Laporan rincian pemasukan dan pengeluaran pada satu akun Kas/Bank"
        action={
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <ToolbarRefreshButton 
              onClick={fetchData} 
              disabled={isLoading}
              title="Segarkan Data"
            />
            <ToolbarExportExcel 
              onClick={handleExportExcel}
              disabled={!data || data.mutasi.length === 0}
            />
            <ToolbarExportPDF 
              onClick={handleExportPdf}
              disabled={!data || data.mutasi.length === 0}
            />
            <ToolbarPrintButton 
              onClick={handlePrint} 
              disabled={!data || data.mutasi.length === 0}
            />
          </div>
        }
      />

      {/* Filter Card */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl shadow-sm border border-border mb-6 print:hidden">
        <div className="text-sm font-semibold text-text-muted mb-2">Pilih Rekening & Periode Laporan</div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4">
          
          <ToolbarFilter
            icon={<Wallet size={14} />}
            value={selectedAkunId}
            onChange={(val) => setSelectedAkunId(val)}
            className="w-full md:w-auto sm:max-w-none md:max-w-xs"
            options={[
              ...(akunKasBank.length === 0 ? [{ label: "Belum ada akun bank...", value: "" }] : []),
              ...akunKasBank.map((a: any) => ({
                label: `${a.kode} - ${a.nama} ${a.unitSekolah ? `(${a.unitSekolah.name})` : ''}`,
                value: a.id
              }))
            ]}
          />

          <ToolbarFilter
            icon={<CalendarIcon size={14} />}
            value={dateRange}
            onChange={(val) => setDateRange(val)}
            className="w-full md:w-auto sm:max-w-none md:max-w-[200px]"
            options={[
              { label: "Semua Waktu", value: "Semua Waktu" },
              { label: "Hari Ini", value: "Hari Ini" },
              { label: "Minggu Ini", value: "Minggu Ini" },
              { label: "Bulan Ini", value: "Bulan Ini" },
              { label: "Bulan Lalu", value: "Bulan Lalu" },
              { label: "Tahun Ini", value: "Tahun Ini" },
              { label: "Kustom", value: "Kustom" }
            ]}
          />

          {dateRange === "Kustom" && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input 
                type="date" 
                value={customStart} 
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-border bg-bg/50 rounded-xl px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-full md:w-auto min-h-[44px] sm:min-h-[38px] short:min-h-[34px]"
              />
              <span className="text-text-muted">-</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-border bg-bg/50 rounded-xl px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-full md:w-auto min-h-[44px] sm:min-h-[38px] short:min-h-[34px]"
              />
            </div>
          )}

          <Button 
            variant="primary"
            size="sm"
            onClick={fetchData} 
            disabled={isLoading} 
            className="w-full md:w-auto gap-2 whitespace-nowrap min-h-[44px] sm:min-h-[38px] short:min-h-[34px] font-bold"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            Filter
          </Button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 print:hidden">
        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 border border-gray-200/60 flex items-center justify-center shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Saldo Awal</div>
            <div className="text-lg sm:text-xl font-black text-text-main">
              {isLoading ? "..." : `Rp ${(data?.saldoAwal || 0).toLocaleString('id-ID')}`}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f32] border border-emerald-200/60 flex items-center justify-center shrink-0">
            <ArrowDownRight size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-0.5">Pemasukan Periode</div>
            <div className="text-lg sm:text-xl font-black text-[#065f32]">
              {isLoading ? "..." : `Rp ${totalDebit.toLocaleString('id-ID')}`}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-2xs border border-border p-3.5 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center justify-center shrink-0">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-rose-700 uppercase tracking-wider mb-0.5">Pengeluaran Periode</div>
            <div className="text-lg sm:text-xl font-black text-rose-700">
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
          <p className="text-sm text-gray-500 mt-1">
            {startDate === endDate
              ? `Per: ${new Date(startDate + "T00:00:00").toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`
              : `Periode: ${new Date(startDate + "T00:00:00").toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} s/d ${new Date(endDate + "T00:00:00").toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`}
          </p>
        </div>

        {/* Tabel Mutasi */}
        <div className="p-0 sm:p-6 print:p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap print:text-xs">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider print:border-b-2 print:border-gray-800 print:bg-gray-50 print:text-gray-700">
                  <th className="p-4 font-semibold print:p-2 print:font-bold">TANGGAL</th>
                  <th className="p-4 font-semibold print:p-2 print:font-bold">NO. REF</th>
                  <th className="p-4 font-semibold print:p-2 print:font-bold min-w-[200px]">KETERANGAN</th>
                  <th className="p-4 font-semibold text-right print:p-2 print:font-bold">DEBIT (MASUK)</th>
                  <th className="p-4 font-semibold text-right print:p-2 print:font-bold">KREDIT (KELUAR)</th>
                  <th className="p-4 font-semibold text-right print:p-2 print:font-bold">SALDO</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-muted text-sm">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="animate-spin text-primary mb-2" size={24} />
                        <span>Memuat mutasi bank...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr className="border-b border-border bg-bg/30 font-semibold print:bg-gray-50/50">
                      <td colSpan={5} className="p-4 text-right text-text-muted text-xs uppercase tracking-wider print:p-2 print:text-gray-600">Saldo Awal:</td>
                      <td className="p-4 text-right text-text-main font-bold tabular-nums text-xs print:p-2 print:text-gray-800">
                        {data ? `Rp ${data.saldoAwal.toLocaleString('id-ID')}` : "-"}
                      </td>
                    </tr>
                    
                    {data?.mutasi.map((m: any, idx: number) => (
                      <tr key={m.id || idx} className="border-b border-border hover:bg-gray-50/50 transition-colors group print:border-gray-100">
                        <td className="p-4 text-sm font-medium text-text-main print:p-2 print:text-xs">{new Date(m.tanggal).toLocaleDateString('id-ID')}</td>
                        <td className="p-4 font-mono text-xs text-text-muted print:p-2 print:text-gray-500">{m.noReferensi}</td>
                        <td className="p-4 print:p-2 whitespace-normal min-w-[200px]">
                          <div className="text-sm font-medium text-text-main">{m.keterangan}</div>
                          {m.pihakKetiga !== "-" && <div className="text-xs text-emerald-600 mt-0.5 font-medium">Mitra/Siswa: {m.pihakKetiga}</div>}
                        </td>
                        <td className="p-4 text-right text-emerald-600 font-medium tabular-nums text-xs leading-5 print:p-2">
                          {m.debit > 0 ? `Rp ${m.debit.toLocaleString('id-ID')}` : "-"}
                        </td>
                        <td className="p-4 text-right text-rose-600 font-medium tabular-nums text-xs leading-5 print:p-2">
                          {m.kredit > 0 ? `Rp ${m.kredit.toLocaleString('id-ID')}` : "-"}
                        </td>
                        <td className="p-4 text-right font-semibold text-text-main tabular-nums text-xs leading-5 print:p-2 print:text-gray-800">
                          Rp {m.saldo.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    
                    {data?.mutasi.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Wallet size={40} className="text-gray-300 mb-3 stroke-[1.5]" />
                            <p className="font-bold text-text-main text-base mb-1">Belum ada mutasi</p>
                            <p className="text-xs text-text-muted max-w-sm">
                              Tidak ada mutasi kas atau bank pada periode yang dipilih.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
              {!isLoading && data && data.mutasi.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border font-bold bg-bg/50 text-text-main print:border-gray-800 print:bg-gray-50 print:text-gray-800">
                    <td colSpan={3} className="p-4 text-right text-xs uppercase tracking-wider print:p-2">Total Mutasi & Saldo Akhir:</td>
                    <td className="p-4 text-right text-emerald-700 tabular-nums text-xs leading-5 print:p-2">Rp {totalDebit.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right text-rose-700 tabular-nums text-xs leading-5 print:p-2">Rp {totalKredit.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right text-blue-700 tabular-nums text-xs leading-5 print:p-2">Rp {data.saldoAkhir.toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <PrintSignature
            pengaturan={pengaturan}
            unitInfo={selectedUnit}
            tipe="ganda"
            tanggal={new Date()}
            kiri={getSignatoryKiri(pengaturan, selectedUnit)}
            kanan={{ jabatan: "Bendahara,", nama: selectedUnit?.namaBendaharaUnit || pengaturan?.namaBendaharaYayasan || userName || "____________________" }}
          />
        </div>

        {/* Print Footer */}
        <PrintFooter />
      </div>
    </div>
  )
}

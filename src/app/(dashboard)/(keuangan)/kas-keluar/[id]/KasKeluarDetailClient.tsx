"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Printer, FileDown, Receipt, BookOpen, Edit, Link2, FileText } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import toast from "react-hot-toast"

export default function KasKeluarDetailClient({ transaksi, pengaturan }: { transaksi: any, pengaturan?: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") || "resi"
  const [activeTab, setActiveTab] = useState<'resi' | 'jurnal'>(tabParam as any)

  useEffect(() => {
    if (tabParam === "resi" || tabParam === "jurnal") {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const setTab = (tab: 'resi' | 'jurnal') => {
    setActiveTab(tab)
    router.replace(`/kas-keluar/${transaksi.id}?tab=${tab}`, { scroll: false })
  }

  // Pisahkan Debit dan Kredit
  const detailDebit = transaksi.detail.filter((d: any) => d.posisi === "DEBIT")
  const detailKredit = transaksi.detail.filter((d: any) => d.posisi === "KREDIT")

  // Helper untuk Terbilang Bahasa Indonesia
  const terbilang = (n: number): string => {
    if (n === 0) return "Nol"
    const bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"]
    if (n < 0) return "Minus " + terbilang(-n)
    if (n < 12) return bil[n]
    if (n < 20) return terbilang(n - 10) + " Belas"
    if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh" + (n % 10 !== 0 ? " " + terbilang(n % 10) : "")
    if (n < 200) return "Seratus" + (n % 100 !== 0 ? " " + terbilang(n % 100) : "")
    if (n < 1000) return terbilang(Math.floor(n / 100)) + " Ratus" + (n % 100 !== 0 ? " " + terbilang(n % 100) : "")
    if (n < 2000) return "Seribu" + (n % 1000 !== 0 ? " " + terbilang(n % 1000) : "")
    if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " Ribu" + (n % 1000 !== 0 ? " " + terbilang(n % 1000) : "")
    if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " Juta" + (n % 1000000 !== 0 ? " " + terbilang(n % 1000000) : "")
    if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + " Miliar" + (n % 1000000000 !== 0 ? " " + terbilang(n % 1000000000) : "")
    return terbilang(Math.floor(n / 1000000000000)) + " Triliun" + (n % 1000000000000 !== 0 ? " " + terbilang(n % 1000000000000) : "")
  }
  
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleExportResiPDF = async () => {
    setIsExportingPDF(true)
    try {
      const { exportResiPdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo } = await import("@/lib/pdf-helpers")

      const items = detailDebit.map((d: any) => ({
        keterangan: `${d.akun.kode} - ${d.akun.nama} ${d.deskripsi ? `(${d.deskripsi})` : ''}`,
        nominal: d.nilai
      }))

      exportResiPdf({
        institutionInfo: buildInstitutionInfo(pengaturan, transaksi.unitSekolah),
        noReferensi: transaksi.noReferensi,
        tanggal: transaksi.tanggal,
        penerimaDari: transaksi.penerima?.name || transaksi.namaPihakKetiga || "-",
        items,
        total: transaksi.totalNilai,
        penandatanganKiri: { jabatan: "Dibuat Oleh,", nama: transaksi.pembuat?.name || "........................" },
        penandatanganKanan: { jabatan: "Diterima Oleh,", nama: "........................" },
        filename: `Resi_KasKeluar_${transaksi.noReferensi}`
      })
      toast.success("Berhasil mencetak Resi")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mencetak Resi")
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportJurnalPDF = async () => {
    setIsExportingPDF(true)
    try {
      const { exportJurnalPdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo } = await import("@/lib/pdf-helpers")

      const detail = transaksi.detail.map((d: any) => ({
        kodeAkun: d.akun.kode,
        namaAkun: d.akun.nama,
        debit: d.posisi === "DEBIT" ? d.nilai : 0,
        kredit: d.posisi === "KREDIT" ? d.nilai : 0
      }))

      exportJurnalPdf({
        institutionInfo: buildInstitutionInfo(pengaturan, transaksi.unitSekolah),
        judulJurnal: "JURNAL TRANSAKSI KAS KELUAR",
        noReferensi: transaksi.noReferensi,
        tanggal: transaksi.tanggal,
        deskripsi: transaksi.deskripsi || "-",
        detail,
        penandatanganKiri: { jabatan: "Dibuat Oleh,", nama: transaksi.pembuat?.name || "........................" },
        penandatanganKanan: { jabatan: "Disetujui Oleh,", nama: "........................" },
        filename: `Jurnal_KasKeluar_${transaksi.noReferensi}`
      })
      toast.success("Berhasil mencetak Jurnal")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mencetak Jurnal")
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full pb-24">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
            Detail Kas Keluar
          </h1>
          <p className="text-text-muted">No. Ref: {transaksi.noReferensi}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={activeTab === 'resi' ? handleExportResiPDF : handleExportJurnalPDF}
            disabled={isExportingPDF}
            className="opacity-100 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800"
          >
            <FileText size={16} className="mr-1.5" /> 
            {isExportingPDF ? "Mengekspor..." : `Cetak ${activeTab === 'resi' ? 'Resi' : 'Jurnal'}`}
          </Button>
          <Link href={`/kas-keluar/${transaksi.id}/edit`}>
            <Button variant="outline" size="sm" className="bg-white border-border hover:bg-bg shadow-sm text-blue-500">
              <Edit size={16} className="mr-2" /> Ubah
            </Button>
          </Link>
          <Link href="/kas-keluar">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white border-border hover:bg-bg shadow-sm ml-2">
              <ArrowLeft size={16} className="text-text-muted" /> <span className="text-text-main font-medium text-sm">Kembali</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        
        <div className="px-6 py-4 border-b border-border bg-bg/50 flex justify-between items-center">
          <h2 className="font-semibold text-text-main">
            {activeTab === 'resi' ? 'Resi Pembayaran' : 'Jurnal Akuntansi'}
          </h2>
          <div className="flex bg-white border border-border rounded-lg overflow-hidden">
            <button 
              onClick={() => setTab('resi')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'resi' ? 'bg-bg text-text-main font-bold' : 'text-text-muted hover:bg-bg/50'}`}
            >
              Resi
            </button>
            <div className="w-px bg-border"></div>
            <button 
              onClick={() => setTab('jurnal')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'jurnal' ? 'bg-bg text-text-main font-bold' : 'text-text-muted hover:bg-bg/50'}`}
            >
              Jurnal
            </button>
          </div>
        </div>

        {/* TAB RESI */}
        {activeTab === 'resi' && (
          <div className="p-6 md:p-8">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-sm">
              <div>
                <p className="text-text-muted mb-1">Kas Keluar Dari :</p>
                <p className="font-semibold text-text-main text-base">{detailKredit[0]?.akun?.nama || "-"}</p>
                
                <p className="text-text-muted mb-1 mt-4">Kepada Penerima :</p>
                <p className="font-semibold text-text-main text-base">{transaksi.penerima?.name || transaksi.namaPihakKetiga || "-"}</p>
                
                <p className="text-text-muted mb-1 mt-4">Deskripsi :</p>
                <p className="font-medium text-text-main">{transaksi.deskripsi || "-"}</p>
              </div>
              <div>
                <p className="text-text-muted mb-1">Referensi Nomer :</p>
                <p className="font-semibold text-text-main">{transaksi.noReferensi}</p>
                
                <p className="text-text-muted mb-1 mt-4">Tanggal :</p>
                <p className="font-semibold text-text-main">{format(new Date(transaksi.tanggal), "dd-MM-yyyy")}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border mb-8">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-bg/50 text-text-muted text-xs uppercase tracking-wider border-b border-border">
                    <th className="p-3 text-center w-16">No</th>
                    <th className="p-3">Akun / Keterangan</th>
                    <th className="p-3">Deskripsi</th>
                    <th className="p-3 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {detailDebit.map((d: any, idx: number) => (
                    <tr key={idx} className="hover:bg-bg/30 transition-colors">
                      <td className="p-3 text-center text-text-muted">{idx + 1}</td>
                      <td className="p-3">
                        <p className="font-medium text-text-main">[{d.akun.kode}] {d.akun.nama}</p>
                      </td>
                      <td className="p-3 text-text-muted">{d.deskripsi}</td>
                      <td className="p-3 text-right font-bold text-text-main">Rp {d.nilai.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  <tr className="bg-bg/50 border-t border-border">
                    <td colSpan={3} className="p-3 font-bold text-text-muted text-right">Total</td>
                    <td className="p-3 text-right font-bold text-albas-green text-lg">Rp {transaksi.totalNilai.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-3 italic text-text-muted bg-white border-t border-border">
                      Terbilang : {terbilang(transaksi.totalNilai)} Rupiah
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-16 text-center text-sm">
              <div>
                <p className="text-text-muted mb-24">Dibuat Oleh</p>
                <div className="border-b border-border w-48 mx-auto"></div>
                <p className="mt-2 font-medium">{transaksi.pembuat?.name}</p>
              </div>
              <div>
                <p className="text-text-muted mb-24">Diterima Oleh</p>
                <div className="border-b border-border w-48 mx-auto"></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB JURNAL */}
        {activeTab === 'jurnal' && (
          <div className="p-6 md:p-8">
            
            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-y-3 mb-8 text-sm">
              <div className="text-text-muted">Referensi Nomer</div>
              <div className="font-semibold text-text-main">: {transaksi.noReferensi}</div>
              
              <div className="text-text-muted">Tanggal</div>
              <div className="font-semibold text-text-main">: {format(new Date(transaksi.tanggal), "dd-MM-yyyy")}</div>
              
              <div className="text-text-muted">Deskripsi</div>
              <div className="font-semibold text-text-main">: {transaksi.deskripsi || "-"}</div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border mb-8">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-bg/50 text-text-muted text-xs uppercase tracking-wider border-b border-border">
                    <th className="p-3">Kode Akun</th>
                    <th className="p-3">Nama Akun</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksi.detail.map((d: any) => (
                    <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-gray-50/50">
                      <td className="p-3 font-medium text-text-main">{d.akun.kode}</td>
                      <td className="p-3 font-medium text-text-main">{d.akun.nama}</td>
                      <td className="p-3 text-right font-bold text-text-main">
                        {d.posisi === "DEBIT" ? `Rp ${d.nilai.toLocaleString('id-ID')}` : "-"}
                      </td>
                      <td className="p-3 text-right font-bold text-text-main">
                        {d.posisi === "KREDIT" ? `Rp ${d.nilai.toLocaleString('id-ID')}` : "-"}
                      </td>
                    </tr>
                  ))}
                  {(() => {
                    const totalDebit = transaksi.detail?.filter((d: any) => d.posisi === "DEBIT").reduce((sum: number, d: any) => sum + d.nilai, 0) || 0
                    const totalKredit = transaksi.detail?.filter((d: any) => d.posisi === "KREDIT").reduce((sum: number, d: any) => sum + d.nilai, 0) || 0
                    return (
                      <tr className="bg-bg/50 border-t border-border">
                        <td colSpan={2} className="p-3 font-bold text-text-muted text-right">Total</td>
                        <td className="p-3 text-right font-bold text-text-main">Rp {totalDebit.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right font-bold text-text-main">Rp {totalKredit.toLocaleString('id-ID')}</td>
                      </tr>
                    )
                  })()}
                </tbody>
              </table>
            </div>

            <div className="mt-16 text-center text-sm w-48">
              <p className="text-text-muted mb-24">Dibuat Oleh:</p>
              <div className="border-b border-border w-full"></div>
              <p className="mt-2 font-medium">{transaksi.pembuat?.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Printer, FileDown, Receipt, BookOpen, Edit, Link2, FileText } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import toast from "react-hot-toast"

export default function KasMasukDetailClient({ transaksi, pengaturan }: { transaksi: any, pengaturan?: any }) {
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
    router.replace(`/kas-masuk/${transaksi.id}?tab=${tab}`, { scroll: false })
  }

  // Pisahkan Debit dan Kredit
  const detailDebit = transaksi.detail.filter((d: any) => d.posisi === "DEBIT")
  const detailKredit = transaksi.detail.filter((d: any) => d.posisi === "KREDIT")

  // Helper untuk Terbilang (Sederhana)
  const terbilang = (angka: number) => {
    // Fungsi terbilang sederhana, in real app you might want a proper package
    // For now we'll just format it or provide a dummy terbilang if needed
    // Or we can just leave it as standard format
  }
  
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleExportResiPDF = async () => {
    setIsExportingPDF(true)
    try {
      const { jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default
      const { drawKopSurat, drawTandaTangan } = await import("@/lib/pdf")
      
      const doc = new jsPDF('landscape', 'mm', 'a5') // A5 landscape for resi
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      let currentY = drawKopSurat(doc, pageWidth, transaksi.unitSekolah?.name || pengaturan?.namaYayasan || "YAYASAN AL BASYARIAH", transaksi.unitSekolah || undefined, 15, pengaturan) + 8
      
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(5, 150, 105)
      doc.text("BUKTI PENERIMAAN KAS", pageWidth / 2, currentY, { align: "center" })
      currentY += 8
      
      // Info
      doc.setTextColor(15, 23, 42)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`No Referensi : ${transaksi.noReferensi}`, 14, currentY)
      doc.text(`Tanggal      : ${format(new Date(transaksi.tanggal), "dd-MM-yyyy")}`, 14, currentY + 6)
      doc.text(`Terima Dari  : ${transaksi.namaPihakKetiga || "-"}`, 120, currentY)
      doc.text(`Ke Akun      : ${detailDebit[0]?.akun?.nama || "-"}`, 120, currentY + 6)

      const tableColumn = ["No", "Akun / Keterangan", "Deskripsi", "Jumlah"]
      const tableRows = detailKredit.map((d: any, idx: number) => [
        idx + 1,
        `${d.akun.kode} - ${d.akun.nama}`,
        d.deskripsi || "-",
        `Rp ${d.nilai.toLocaleString('id-ID')}`
      ])

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY + 16,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [46, 125, 50] } // Albas Green
      })

      const finalY = (doc as any).lastAutoTable.finalY || 60
      
      doc.setFont("helvetica", "bold")
      doc.text(`Total Penerimaan: Rp ${transaksi.totalNilai.toLocaleString('id-ID')}`, 14, finalY + 10)
      
      // Signatures
      drawTandaTangan(
        doc,
        pageWidth,
        pageHeight,
        finalY,
        pengaturan,
        transaksi.unitSekolah,
        new Date(transaksi.tanggal),
        { jabatan: "Dibuat Oleh,", nama: transaksi.pembuat?.name || "........................" },
        { jabatan: "Diterima Oleh,", nama: "........................" }
      )

      doc.save(`Resi_KasMasuk_${transaksi.noReferensi}.pdf`)
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
      const { jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default
      const { drawKopSurat, drawTandaTangan } = await import("@/lib/pdf")
      
      const doc = new jsPDF('portrait')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      let currentY = drawKopSurat(doc, pageWidth, transaksi.unitSekolah?.name || pengaturan?.namaYayasan || "YAYASAN AL BASYARIAH", transaksi.unitSekolah || undefined, 12, pengaturan) + 8
      
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(5, 150, 105)
      doc.text("JURNAL TRANSAKSI KAS MASUK", pageWidth / 2, currentY, { align: "center" })
      currentY += 8
      
      // Info
      doc.setTextColor(15, 23, 42)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`No Referensi : ${transaksi.noReferensi}`, 14, currentY)
      doc.text(`Tanggal      : ${format(new Date(transaksi.tanggal), "dd-MM-yyyy")}`, 14, currentY + 6)
      doc.text(`Deskripsi    : ${transaksi.deskripsi || "-"}`, 14, currentY + 12)

      const tableColumn = ["Kode Akun", "Nama Akun", "Debit", "Kredit"]
      const tableRows = transaksi.detail.map((d: any) => [
        d.akun.kode,
        d.akun.nama,
        d.posisi === "DEBIT" ? `Rp ${d.nilai.toLocaleString('id-ID')}` : "-",
        d.posisi === "KREDIT" ? `Rp ${d.nilai.toLocaleString('id-ID')}` : "-"
      ])

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY + 18,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] } // Slate 800
      })

      const finalY = (doc as any).lastAutoTable.finalY || 70
      
      // Signatures
      drawTandaTangan(
        doc,
        pageWidth,
        pageHeight,
        finalY,
        pengaturan,
        transaksi.unitSekolah,
        new Date(transaksi.tanggal),
        { jabatan: "Dibuat Oleh,", nama: transaksi.pembuat?.name || "........................" },
        { jabatan: "Disetujui Oleh,", nama: "........................" }
      )

      doc.save(`Jurnal_KasMasuk_${transaksi.noReferensi}.pdf`)
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
            Detail Kas Masuk
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
          <Link href={`/kas-masuk/${transaksi.id}/edit`}>
            <Button variant="outline" size="sm" className="bg-white border-border hover:bg-bg shadow-sm text-blue-500">
              <Edit size={16} className="mr-2" /> Ubah
            </Button>
          </Link>
          <Link href="/kas-masuk">
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
            
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
              <div>
                <p className="text-text-muted mb-1">Dari :</p>
                <p className="font-semibold text-text-main text-base">{transaksi.namaPihakKetiga || "-"}</p>
                
                <p className="text-text-muted mb-1 mt-4">Ke :</p>
                <p className="font-semibold text-text-main text-base">{detailDebit[0]?.akun?.nama || "-"}</p>
                
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
                  {detailKredit.map((d: any, idx: number) => (
                    <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-gray-50/50">
                      <td className="p-3 text-center text-text-muted">{idx + 1}</td>
                      <td className="p-3 font-medium text-text-main">{d.akun.kode} - {d.akun.nama}</td>
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
                      Terbilang : (Fungsi terbilang belum aktif)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-16 text-center text-sm">
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
            
            <div className="grid grid-cols-[150px_1fr] gap-y-3 mb-8 text-sm">
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
                  <tr className="bg-bg/50 border-t border-border">
                    <td colSpan={2} className="p-3 font-bold text-text-muted text-right">Total</td>
                    <td className="p-3 text-right font-bold text-text-main">Rp {transaksi.totalNilai.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-bold text-text-main">Rp {transaksi.totalNilai.toLocaleString('id-ID')}</td>
                  </tr>
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

"use client"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Printer, Share2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import toast from "react-hot-toast"
import { exportResiPdf } from "@/lib/pdf"
import PrintHeader from "@/components/shared/print/PrintHeader"
import PrintSignature from "@/components/shared/print/PrintSignature"
import PrintFooter from "@/components/shared/print/PrintFooter"

export type ReceiptData = {
  noReferensi: string
  tanggal: Date
  muridName: string
  items: { 
    namaAkun: string; 
    jumlahBayar: number; 
    sisaTagihanAwal?: number;
    potongan?: number;
    kategoriPotongan?: string;
    sisaTagihan?: number;
  }[]
  total: number
}

interface ModalResiPembayaranProps {
  isOpen: boolean
  onClose: () => void
  data: ReceiptData | null
  pengaturan?: any
  unitInfo?: any
  currentUser?: any
}

export default function ModalResiPembayaran({
  isOpen,
  onClose,
  data,
  pengaturan,
  unitInfo,
  currentUser
}: ModalResiPembayaranProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when receipt modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen || !data || !mounted) return null

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
  }

  const handlePrint = async () => {
    try {
      const { buildInstitutionInfo } = await import("@/lib/pdf-helpers")
      
      exportResiPdf({
        institutionInfo: buildInstitutionInfo(pengaturan, unitInfo),
        noReferensi: data.noReferensi,
        tanggal: data.tanggal,
        penerimaDari: data.muridName,
        items: data.items.map(item => ({
          keterangan: item.namaAkun,
          nominal: item.jumlahBayar,
          sisaTagihanAwal: item.sisaTagihanAwal,
          potongan: item.potongan,
          kategoriPotongan: item.kategoriPotongan,
          sisaTagihan: item.sisaTagihan
        })),
        total: data.total,
        catatan: pengaturan?.catatanKwitansi,
        penandatanganKanan: { jabatan: "Bendahara Penerima,", nama: currentUser?.name || "Staf Keuangan" },
        filename: `Kwitansi_${data.noReferensi}`
      })
      toast.success("Berhasil mengunduh Bukti Pembayaran (PDF)")
    } catch (err: any) {
      toast.error("Gagal membuat PDF: " + err.message)
    }
  }

  const handleShareWA = () => {
    const yayasanName = pengaturan?.namaYayasan || "Yayasan Al Basyariah"
    const text = `*BUKTI PEMBAYARAN TAGIHAN*\n${yayasanName}\n\n` +
      `No. Ref: ${data.noReferensi}\n` +
      `Tanggal: ${format(new Date(data.tanggal), 'dd MMMM yyyy', { locale: idLocale })}\n` +
      `Siswa: *${data.muridName}*\n\n` +
      `*Rincian Pembayaran:*\n` +
      data.items.map(item => `- ${item.namaAkun}: ${formatRupiah(item.jumlahBayar)}`).join('\n') +
      `\n\n*Total Bayar: ${formatRupiah(data.total)}*\n\n` +
      `Terima kasih.`
      
    const encodedText = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 print:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={onClose} />
      
      {/* Container */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:w-full print:max-w-none print:rounded-none flex flex-col max-h-[calc(100dvh-32px)] z-10"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Print-only CSS injection */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            .print-receipt, .print-receipt * { visibility: visible; }
            .print-receipt { position: absolute; left: 0; top: 0; width: 100%; max-width: 210mm; margin: 0 auto; }
            .no-print { display: none !important; }
            @page { size: A5 landscape; margin: 10mm; }
          }
        `}} />

        {/* Header - Non Print */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-bg/50 no-print shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-albas-green m-0 leading-tight truncate">Pratinjau Kwitansi</h2>
              <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 leading-relaxed truncate sm:whitespace-normal">Kwitansi resmi pembayaran tagihan santri/siswa</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer"
            type="button"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Receipt Body (Scrollable if too tall) */}
        <div className="print-receipt w-full bg-white text-slate-900 overflow-y-auto p-4 sm:p-10 shrink">
          
          {/* Kop Kwitansi */}
          <PrintHeader 
            unitInfo={unitInfo} 
            pengaturan={pengaturan} 
            className="block" 
          />

          {/* Tanggal & No Ref */}
          <div className="flex justify-between items-center mb-6 text-sm mt-4">
            <h4 className="text-xl font-black text-slate-900 uppercase border-b border-slate-900 pb-1">Kwitansi Pembayaran</h4>
            <div className="text-right text-xs text-slate-600">
              <div><span className="font-semibold">Tanggal:</span> {format(new Date(data.tanggal), 'dd MMMM yyyy', { locale: idLocale })}</div>
              <div><span className="font-semibold">No. Ref:</span> {data.noReferensi}</div>
            </div>
          </div>

          {/* Identitas Penyetor */}
          <div className="flex mb-6 text-sm">
            <div className="w-40 text-slate-600">Telah terima dari</div>
            <div className="w-4 text-slate-600">:</div>
            <div className="font-bold text-slate-900">{data.muridName}</div>
          </div>

          {/* Tabel Rincian */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[500px] sm:min-w-full">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300">
                  <th className="py-2 px-4 text-center font-bold text-slate-700 w-12 border-x border-slate-300">No</th>
                  <th className="py-2 px-4 text-left font-bold text-slate-700 border-r border-slate-300">Keterangan Pembayaran</th>
                  <th className="py-2 px-4 text-right font-bold text-slate-700 w-48 border-r border-slate-300">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-3 px-4 text-center border-x border-slate-200 align-top">{idx + 1}</td>
                    <td className="py-3 px-4 text-left border-r border-slate-200 align-top">
                      <div className="font-medium text-slate-800">{item.namaAkun}</div>
                      
                      {Boolean(((item.potongan && item.potongan > 0) || (item.sisaTagihan && item.sisaTagihan > 0)) && item.sisaTagihanAwal && item.sisaTagihanAwal > 0) && (
                        <div className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                          Tagihan Awal: {formatRupiah(item.sisaTagihanAwal || 0)}
                        </div>
                      )}
                      
                      {Boolean(item.potongan && item.potongan > 0) && (
                        <div className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                          Diskon ({item.kategoriPotongan || 'Lainnya'}): -{formatRupiah(item.potongan || 0)}
                        </div>
                      )}
                      
                      {Boolean(item.sisaTagihan && item.sisaTagihan > 0) && (
                        <div className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                          * Pembayaran Sebagian. Sisa Tagihan Akhir: {formatRupiah(item.sisaTagihan || 0)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right border-r border-slate-200 font-medium align-top">{formatRupiah(item.jumlahBayar)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-b border-slate-300">
                  <td colSpan={2} className="py-3 px-4 text-right font-bold text-slate-800 border-x border-slate-300">TOTAL PEMBAYARAN</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 border-r border-slate-300">{formatRupiah(data.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Area Tanda Tangan */}
          <PrintSignature
            pengaturan={pengaturan}
            unitInfo={unitInfo}
            tipe="ganda"
            tanggal={data.tanggal}
            kiri={{ jabatan: "Penyetor / Wali Murid,", nama: data.muridName }}
            kanan={{ jabatan: "Bendahara Penerima,", nama: currentUser?.name || "Staf Keuangan" }}
            className="flex"
          />

          {/* Catatan */}
          <PrintFooter 
            pengaturan={pengaturan} 
            className="block" 
          />
        </div>

        {/* Action Buttons - Non Print */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-border bg-surface/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-end gap-2.5 sm:gap-3 no-print">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto min-h-[44px] font-semibold">
            Tutup
          </Button>
          <Button onClick={handleShareWA} variant="outline" className="w-full sm:w-auto min-h-[44px] font-semibold border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
            <Share2 size={16} className="mr-2" /> Bagikan WA
          </Button>
          <Button onClick={handlePrint} className="w-full sm:w-auto min-h-[44px] font-bold bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20">
            <Printer size={16} className="mr-2" /> Unduh PDF Formal
          </Button>
        </div>

      </div>
    </div>,
    document.body
  )
}

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
  unitSekolahName?: string
  items: { namaAkun: string, jumlahBayar: number }[]
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
  if (!isOpen || !data) return null

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
          nominal: item.jumlahBayar
        })),
        total: data.total,
        catatan: pengaturan?.catatanKwitansi,
        penandatanganKiri: { jabatan: "Penyetor / Wali Murid,", nama: data.muridName },
        penandatanganKanan: { jabatan: "Bendahara Penerima,", nama: currentUser?.name || pengaturan?.namaBendahara || "Staf Keuangan" },
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

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 print:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={onClose} />
      
      {/* Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:w-full print:max-w-none print:rounded-none flex flex-col max-h-[90vh]">
        
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
        <div className="bg-slate-50 border-b border-slate-200 flex items-center justify-between p-4 text-slate-800 no-print shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Pratinjau Kwitansi</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Receipt Body (Scrollable if too tall) */}
        <div className="print-receipt w-full bg-white text-slate-900 overflow-y-auto p-8 sm:p-10 shrink">
          
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
          <div className="mb-8">
            <table className="w-full text-sm border-collapse">
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
                    <td className="py-3 px-4 text-center border-x border-slate-200">{idx + 1}</td>
                    <td className="py-3 px-4 text-left border-r border-slate-200 font-medium text-slate-800">{item.namaAkun}</td>
                    <td className="py-3 px-4 text-right border-r border-slate-200 font-medium">{formatRupiah(item.jumlahBayar)}</td>
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
            kanan={{ jabatan: "Bendahara Penerima,", nama: currentUser?.name || pengaturan?.namaBendahara || "Staf Keuangan" }}
            className="flex"
          />

          {/* Catatan */}
          <PrintFooter 
            pengaturan={pengaturan} 
            className="block" 
          />
        </div>

        {/* Action Buttons - Non Print */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex gap-3 no-print shrink-0 rounded-b-2xl">
          <Button onClick={handleShareWA} variant="outline" className="flex-1 bg-white hover:bg-slate-100 text-slate-700">
            <Share2 size={16} className="mr-2" /> Bagikan WA
          </Button>
          <Button onClick={handlePrint} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            <Printer size={16} className="mr-2" /> Unduh PDF Formal
          </Button>
        </div>

      </div>
    </div>
  )
}

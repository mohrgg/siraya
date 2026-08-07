import { X, Printer, Share2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import toast from "react-hot-toast"
import { exportResiPdf } from "@/lib/pdf"

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
      exportResiPdf({
        noReferensi: data.noReferensi,
        tanggal: data.tanggal,
        muridName: data.muridName,
        unitSekolahName: data.unitSekolahName,
        namaYayasan: pengaturan?.namaYayasan,
        items: data.items,
        total: data.total,
        catatanKwitansi: pengaturan?.catatanKwitansi,
        namaBendahara: currentUser?.name || pengaturan?.namaBendahara || "Staf Keuangan",
        pengaturan,
        unitInfo
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
          <div className="text-center border-b-[3px] border-double border-slate-800 pb-4 mb-6 relative">
            <h3 className="font-bold text-sm tracking-tight text-slate-500 uppercase">{pengaturan?.namaYayasan || "YAYASAN AL BASYARIAH / SIRAYA EDUCATION"}</h3>
            <h2 className="font-black text-2xl tracking-tight text-slate-900 uppercase mt-1">{(data.unitSekolahName || unitInfo?.name || pengaturan?.namaYayasan || "YAYASAN AL BASYARIAH").toUpperCase()}</h2>
            
            <p className="text-xs font-medium text-slate-600 mt-2 max-w-2xl mx-auto">
              {[
                unitInfo?.address || pengaturan?.alamat,
                (unitInfo?.phone || pengaturan?.telepon) && `Telp: ${unitInfo?.phone || pengaturan?.telepon}`,
                (unitInfo?.email || pengaturan?.email) && `Email: ${unitInfo?.email || pengaturan?.email}`,
                (unitInfo?.website || pengaturan?.website) && `Web: ${unitInfo?.website || pengaturan?.website}`
              ].filter(Boolean).join(' • ') || "Jl. Pendidikan Nusantara No. 123, Bandung, Jawa Barat • Telp: (022) 1234567 • Email: info@siraya.edu"}
            </p>
            
            <div className="absolute right-0 top-0 text-right text-xs text-slate-600 space-y-1 bg-slate-50 p-2 border border-slate-200 rounded-lg shadow-sm print:shadow-none print:border-none print:bg-transparent">
              <div><span className="font-semibold">Tanggal:</span> {format(new Date(data.tanggal), 'dd MMMM yyyy', { locale: idLocale })}</div>
              <div><span className="font-semibold">No. Ref:</span> {data.noReferensi}</div>
            </div>
          </div>

          {/* Judul Kwitansi */}
          <div className="text-center mb-8">
            <h4 className="inline-block text-xl font-black text-slate-900 uppercase border-b border-slate-900 pb-1">Kwitansi Pembayaran</h4>
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
          <div className="flex justify-between items-end text-sm mt-12 mb-6">
            <div className="text-center w-64">
              <p className="mb-16">Penyetor / Wali Murid,</p>
              <p className="font-bold underline underline-offset-4 decoration-slate-300">{data.muridName}</p>
            </div>
            
            <div className="text-center w-64">
              <p className="mb-1">Bandung, {format(new Date(data.tanggal), 'dd MMMM yyyy', { locale: idLocale })}</p>
              <p className="mb-16">Bendahara Penerima,</p>
              <p className="font-bold underline underline-offset-4 decoration-slate-300">{currentUser?.name || pengaturan?.namaBendahara || "Staf Keuangan"}</p>
            </div>
          </div>

          {/* Catatan */}
          <div className="text-center text-xs text-slate-500 italic mt-8 border-t border-slate-100 pt-4">
            {pengaturan?.catatanKwitansi || "Terima kasih atas pembayaran Anda. Simpan kwitansi ini sebagai bukti pembayaran yang sah."}
          </div>
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

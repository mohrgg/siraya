import { X, Receipt, Calendar, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { ReceiptData } from "./ModalResiPembayaran"

interface ModalPilihRiwayatTransaksiProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (data: ReceiptData) => void
  riwayat: any[]
}

export default function ModalPilihRiwayatTransaksi({
  isOpen,
  onClose,
  onSelect,
  riwayat
}: ModalPilihRiwayatTransaksiProps) {
  if (!isOpen) return null

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-emerald-500 flex items-center justify-between p-4 px-6 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Receipt size={20} className="text-white" />
            <h2 className="text-lg font-bold">Riwayat Pembayaran</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-emerald-600 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-text-muted mb-4">
            Tagihan ini memiliki lebih dari 1 riwayat pembayaran (dicicil/digabung). Silakan pilih resi mana yang ingin dicetak:
          </p>
          
          <div className="space-y-3">
            {riwayat.map((tx, idx) => (
              <div 
                key={tx.transaksiId} 
                className="border border-border rounded-xl p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer bg-white group flex items-center justify-between"
                onClick={() => onSelect(tx)}
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                    <Calendar size={14} />
                    {format(new Date(tx.tanggal), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                  </div>
                  <div className="font-bold text-slate-800 mb-1">{tx.noReferensi}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <CreditCard size={12} />
                    Total Transaksi: <span className="font-bold text-emerald-600">{formatRupiah(tx.total)}</span>
                  </div>
                </div>
                
                <div className="shrink-0 bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white p-2 rounded-lg transition-colors">
                  <Receipt size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-border flex justify-end shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="px-6 rounded-xl font-bold">
            Batal
          </Button>
        </div>
      </div>
    </div>
  )
}

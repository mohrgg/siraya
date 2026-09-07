"use client"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
            {riwayat.map((tx, idx) => {
              const mainItem = tx.items?.[0]
              const hasPotongan = Boolean(mainItem && mainItem.potongan && mainItem.potongan > 0)
              const sisa = mainItem ? mainItem.sisaTagihan : undefined

              return (
                <div 
                  key={tx.transaksiId} 
                  className="border border-border rounded-xl p-4 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer bg-white group flex items-center justify-between"
                  onClick={() => onSelect(tx)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tx.terminKe ? `Termin ${tx.terminKe}` : `Pembayaran ${idx + 1}`}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Calendar size={13} className="text-slate-400" />
                        {format(new Date(tx.tanggal), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                      </div>
                    </div>

                    <div className="font-bold text-slate-800 text-sm font-mono tracking-tight">{tx.noReferensi}</div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-0.5">
                      <div className="flex items-center gap-1">
                        <CreditCard size={12} className="text-slate-400" />
                        <span>Kas Dibayar:</span>
                        <span className="font-bold text-emerald-700">{formatRupiah(tx.total)}</span>
                      </div>
                      
                      {hasPotongan && (
                        <div className="text-rose-600 font-medium">
                          (Diskon: {formatRupiah(mainItem.potongan)})
                        </div>
                      )}

                      {sisa !== undefined && (
                        <div className="text-slate-500">
                          • Sisa: <span className={sisa === 0 ? "text-emerald-600 font-bold" : "text-amber-600 font-semibold"}>
                            {sisa === 0 ? "Lunas" : formatRupiah(sisa)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="shrink-0 ml-3 bg-slate-100 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white p-2.5 rounded-xl transition-all shadow-2xs">
                    <Receipt size={18} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-border flex justify-end shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="px-6 rounded-xl font-bold">
            Batal
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

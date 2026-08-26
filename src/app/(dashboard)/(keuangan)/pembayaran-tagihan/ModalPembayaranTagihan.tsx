import { useState, useEffect } from "react"
import { X, Calendar as CalendarIcon, FileText } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export type TagihanItem = {
  tagihanId: string
  namaAkun: string
  kodeAkun: string
  akunPendapatanId: string
  sisaTagihan: number
  jumlahBayar: number
}

interface ModalPembayaranTagihanProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isSubmitting: boolean
  
  muridName: string
  items: TagihanItem[]
  akunKasBankList: any[]
}

export default function ModalPembayaranTagihan({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  muridName,
  items,
  akunKasBankList
}: ModalPembayaranTagihanProps) {
  const [akunKasId, setAkunKasId] = useState("")
  const [tanggal, setTanggal] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [deskripsi, setDeskripsi] = useState("")
  const [noReferensi, setNoReferensi] = useState("")
  const [localItems, setLocalItems] = useState<TagihanItem[]>([])
  
  // Format currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(val)
  }

  const totalSisaTagihan = items.reduce((acc, item) => acc + item.sisaTagihan, 0)
  const totalBayar = localItems.reduce((acc, item) => acc + item.jumlahBayar, 0)
  
  useEffect(() => {
    if (isOpen) {
      if (akunKasBankList.length > 0) {
        setAkunKasId(akunKasBankList[0].id)
      }
      setTanggal(format(new Date(), 'yyyy-MM-dd'))
      setDeskripsi(`Pembayaran Tagihan Siswa: ${muridName}`)
      setNoReferensi(`INV-${format(new Date(), 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`)
      setLocalItems(items.map(item => ({...item})))
    }
  }, [isOpen, akunKasBankList, muridName, items])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      akunKasId,
      tanggal: new Date(tanggal),
      deskripsi,
      noReferensi,
      items: localItems
    })
  }

  const handleItemChange = (tagihanId: string, val: string) => {
    const numericStr = val.replace(/[^0-9]/g, '')
    const num = numericStr ? parseInt(numericStr, 10) : 0
    
    setLocalItems(prev => prev.map(item => {
      if (item.tagihanId === tagihanId) {
        const validNum = Math.min(num, item.sisaTagihan)
        return { ...item, jumlahBayar: validNum }
      }
      return item
    }))
  }

  const handleLunasChange = (tagihanId: string, isLunas: boolean) => {
    setLocalItems(prev => prev.map(item => {
      if (item.tagihanId === tagihanId) {
        return { ...item, jumlahBayar: isLunas ? item.sisaTagihan : 0 }
      }
      return item
    }))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header (Green theme as per screenshot) */}
        <div className="bg-emerald-500 flex items-center justify-between p-4 px-6 text-white shrink-0">
          <h2 className="text-lg font-bold">Konfirmasi Pembayaran</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-emerald-600 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Form Fields Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-text-main block mb-1.5">Akun (Kas)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center">
                      <span className="text-[10px] font-bold">Rp</span>
                    </div>
                  </div>
                  <select
                    className="w-full pl-10 pr-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-medium"
                    value={akunKasId}
                    onChange={(e) => setAkunKasId(e.target.value)}
                    required
                  >
                    <option value="">Pilih Akun...</option>
                    {akunKasBankList.map(akun => (
                      <option key={akun.id} value={akun.id}>{akun.nama} [{akun.kode}]</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1.5">Tanggal Pembayaran</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center">
                      <CalendarIcon size={12} />
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-medium"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1.5">No. Referensi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center">
                      <FileText size={12} />
                    </div>
                  </div>
                  <input
                    type="text"
                    readOnly
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-border rounded-xl text-sm font-medium text-text-muted cursor-not-allowed"
                    value={noReferensi}
                  />
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="text-xs font-bold text-text-main block mb-1.5">Deskripsi</label>
              <div className="relative">
                <div className="absolute top-2.5 left-3 pointer-events-none">
                  <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center">
                    <FileText size={12} />
                  </div>
                </div>
                <textarea
                  required
                  rows={2}
                  className="w-full pl-10 pr-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-medium resize-none"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                />
              </div>
            </div>

            {/* Table of selected items */}
            <div className="border border-border rounded-xl overflow-hidden mt-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-emerald-500 text-white">
                  <tr>
                    <th className="px-4 py-2 w-12 text-center">No.</th>
                    <th className="px-4 py-2">Tagihan</th>
                    <th className="px-4 py-2 text-right">Nominal Tagihan</th>
                  </tr>
                </thead>
                <tbody>
                  {localItems.map((item, idx) => {
                    const isLunas = item.jumlahBayar === item.sisaTagihan;
                    
                    return (
                      <tr key={item.tagihanId} className="border-b border-border last:border-0 bg-white hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-center text-text-muted">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-text-main leading-tight">
                            {item.namaAkun} <span className="text-xs text-text-muted">[{item.kodeAkun}]</span>
                          </div>
                          <div className="text-[10px] text-text-muted font-bold mt-1">Sisa: Rp {formatRupiah(item.sisaTagihan)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-text-muted hover:text-emerald-600 transition-colors">
                              <input 
                                type="checkbox" 
                                className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                checked={isLunas}
                                onChange={(e) => handleLunasChange(item.tagihanId, e.target.checked)}
                              />
                              Lunas
                            </label>
                            
                            <div className="relative w-36">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted pointer-events-none">Rp</span>
                              <input 
                                type="text"
                                className={`w-full pl-8 pr-2 py-1.5 text-sm font-bold border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors ${
                                  isLunas ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 'bg-white border-border text-text-main'
                                }`}
                                value={item.jumlahBayar > 0 ? formatRupiah(item.jumlahBayar) : ""}
                                onChange={(e) => handleItemChange(item.tagihanId, e.target.value)}
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mt-4">
              <div className="w-full sm:w-1/2 space-y-3 bg-bg/50 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-text-muted">Total Sisa Tagihan :</span>
                  <div className="bg-white border border-border rounded-lg px-3 py-1.5 w-40 text-right font-bold text-text-muted">
                    {formatRupiah(totalSisaTagihan)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-text-main">Total Dibayar :</span>
                  <div className="bg-white border border-emerald-500 rounded-lg px-3 py-1.5 w-40 text-right font-bold text-emerald-600 bg-emerald-50/50 shadow-sm">
                    {formatRupiah(totalBayar)}
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-gray-50 flex justify-end gap-3 shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="font-semibold"
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            form="payment-form"
            disabled={isSubmitting || items.length === 0}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 shadow-sm shadow-emerald-200"
          >
            {isSubmitting ? "Memproses..." : "Proses Bayar Tagihan"}
          </Button>
        </div>

      </div>
    </div>
  )
}

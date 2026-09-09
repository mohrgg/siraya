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
  potongan: number
  kategoriPotongan: string
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
  
  const [isCustomKategoriMap, setIsCustomKategoriMap] = useState<Record<string, boolean>>({})

  // Constants
  const PREDEFINED_POTONGAN = ["-", "Beasiswa Yayasan", "Anak Karyawan", "Anak Yatim", "Jalur Prestasi"]

  // Format currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(val)
  }

  const totalSisaTagihan = items.reduce((acc, item) => acc + item.sisaTagihan, 0)
  const totalBayar = localItems.reduce((acc, item) => acc + item.jumlahBayar, 0)
  const totalPotongan = localItems.reduce((acc, item) => acc + item.potongan, 0)
  
  useEffect(() => {
    if (isOpen) {
      if (akunKasBankList.length > 0) {
        setAkunKasId(akunKasBankList[0].id)
      }
      setTanggal(format(new Date(), 'yyyy-MM-dd'))
      setDeskripsi(`Pembayaran Tagihan Siswa: ${muridName}`)
      setNoReferensi(`INV-${format(new Date(), 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`)
      setLocalItems(items.map(item => ({
        ...item, 
        potongan: 0, 
        kategoriPotongan: "-"
      })))
      setIsCustomKategoriMap({})
    }
  }, [isOpen, akunKasBankList, muridName, items])

  if (!isOpen) return null

  const handleItemBayarChange = (id: string, val: string) => {
    const num = parseInt(val.replace(/\D/g, '')) || 0
    setLocalItems(prev => prev.map(item => {
      if (item.tagihanId === id) {
        // Ensure bayar + potongan doesn't exceed sisa
        let newBayar = num
        if (newBayar + item.potongan > item.sisaTagihan) {
          newBayar = item.sisaTagihan - item.potongan
        }
        return { ...item, jumlahBayar: newBayar }
      }
      return item
    }))
  }

  const handleItemPotonganChange = (id: string, val: string) => {
    const num = parseInt(val.replace(/\D/g, '')) || 0
    setLocalItems(prev => prev.map(item => {
      if (item.tagihanId === id) {
        let newPotongan = num
        // Diskon tidak boleh melebihi sisa tagihan
        if (newPotongan > item.sisaTagihan) {
          newPotongan = item.sisaTagihan
        }
        
        let newBayar = item.jumlahBayar
        
        // Smart Auto-Adjust Logic
        // Jika sebelumnya berniat lunas (Bayar == Sisa - PotonganLama)
        if (item.jumlahBayar === item.sisaTagihan - item.potongan) {
          // Tetap lunas dengan mengkalkulasi ulang
          newBayar = item.sisaTagihan - newPotongan
        } else {
          // Jika mencicil, hanya turunkan bayaran jika melebihi batas utang baru
          if (newBayar + newPotongan > item.sisaTagihan) {
            newBayar = item.sisaTagihan - newPotongan
          }
        }

        return { ...item, potongan: newPotongan, jumlahBayar: newBayar }
      }
      return item
    }))
  }

  const handleKategoriPotonganChange = (id: string, val: string) => {
    setLocalItems(prev => prev.map(item => item.tagihanId === id ? { ...item, kategoriPotongan: val } : item))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (totalBayar + totalPotongan > totalSisaTagihan) {
      alert("Total pembayaran dan potongan tidak boleh melebihi sisa tagihan")
      return
    }
    onSubmit({
      akunKasId,
      tanggal: new Date(tanggal),
      deskripsi,
      noReferensi,
      items: localItems
    })
  }

  const handleLunasChange = (tagihanId: string, isLunas: boolean) => {
    setLocalItems(prev => prev.map(item => {
      if (item.tagihanId === tagihanId) {
        return { ...item, jumlahBayar: isLunas ? (item.sisaTagihan - item.potongan) : 0 }
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
                <thead className="bg-bg/50 border-b border-border/80 text-text-muted text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-left">Nama Tagihan</th>
                    <th className="py-3 px-4 text-right">Sisa Tagihan</th>
                    <th className="py-3 px-4 text-center">Diskon / Potongan</th>
                    <th className="py-3 px-4 text-center">Nominal Bayar</th>
                  </tr>
                </thead>
                <tbody>
                  {localItems.map(item => (
                    <tr key={item.tagihanId} className="border-b border-border/50">
                      <td className="py-3 px-4 text-text-main font-semibold text-sm">{item.namaAkun}</td>
                      <td className="py-3 px-4 text-right font-medium text-text-muted/80 text-sm">Rp {formatRupiah(item.sisaTagihan)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5 w-[160px] mx-auto">
                          <div className="relative group/input flex items-center">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60 text-xs font-semibold z-10">Rp.</span>
                            <input 
                              type="text"
                              className="w-full pl-8 pr-3 py-1.5 bg-bg border border-border/60 hover:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white text-sm font-semibold text-right transition-all text-text-main placeholder:text-text-muted/40"
                              value={item.potongan ? formatRupiah(item.potongan) : ""}
                              onChange={(e) => handleItemPotonganChange(item.tagihanId, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          {item.potongan > 0 && (
                            isCustomKategoriMap[item.tagihanId] ? (
                              <div className="relative">
                                <input 
                                  type="text" 
                                  className="w-full px-2 py-1 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-text-main"
                                  placeholder="Ketik kategori..."
                                  value={item.kategoriPotongan}
                                  onChange={e => handleKategoriPotonganChange(item.tagihanId, e.target.value)}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  className="absolute right-1 top-1 text-text-muted hover:text-red-500"
                                  onClick={() => {
                                    setIsCustomKategoriMap(prev => ({...prev, [item.tagihanId]: false}))
                                    handleKategoriPotonganChange(item.tagihanId, "-")
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <select 
                                className="w-full px-2 py-1 text-[11px] font-medium bg-gray-50 border border-border rounded focus:outline-none focus:border-emerald-500/50 text-text-main"
                                value={item.kategoriPotongan || "-"}
                                onChange={e => {
                                  if (e.target.value === "LAINNYA") {
                                    setIsCustomKategoriMap(prev => ({...prev, [item.tagihanId]: true}))
                                    handleKategoriPotonganChange(item.tagihanId, "")
                                  } else {
                                    handleKategoriPotonganChange(item.tagihanId, e.target.value)
                                  }
                                }}
                              >
                                {PREDEFINED_POTONGAN.map(kat => (
                                  <option key={kat} value={kat}>{kat}</option>
                                ))}
                                <option value="LAINNYA" className="font-bold text-emerald-600">+ Ketik Sendiri...</option>
                              </select>
                            )
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative group/input flex items-center w-[130px] mx-auto">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60 text-xs font-semibold z-10">Rp.</span>
                          <input 
                            type="text"
                            className="w-full pl-8 pr-3 py-1.5 bg-bg border border-border/60 hover:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white text-sm font-semibold text-right transition-all text-text-main placeholder:text-text-muted/40"
                            value={item.jumlahBayar ? formatRupiah(item.jumlahBayar) : ""}
                            onChange={(e) => handleItemBayarChange(item.tagihanId, e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col gap-2 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-amber-800/70">Total Tagihan:</span>
                <span className="font-bold text-amber-900">Rp {formatRupiah(totalSisaTagihan)}</span>
              </div>
              {totalPotongan > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-emerald-700/80">Total Subsidi / Diskon:</span>
                  <span className="font-bold text-emerald-700">- Rp {formatRupiah(totalPotongan)}</span>
                </div>
              )}
              <div className="w-full h-px bg-amber-200/50 my-1"></div>
              <div className="flex justify-between items-center text-base">
                <span className="font-bold text-amber-900">Total Pembayaran Kas:</span>
                <span className="font-extrabold text-primary text-xl tracking-tight">Rp {formatRupiah(totalBayar)}</span>
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

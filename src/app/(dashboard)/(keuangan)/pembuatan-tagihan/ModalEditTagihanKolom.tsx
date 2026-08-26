"use client"

import { useState, useEffect } from "react"
import { X, Edit2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function ModalEditTagihanKolom({ 
  isOpen, 
  onClose,
  onSubmit,
  akunPendapatanList,
  editingCol,
  isSubmitting,
  hasPayments
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { 
    akunId: string, 
    namaTagihan: string,
    jumlah: number
  }) => void
  akunPendapatanList: any[]
  editingCol: any | null
  isSubmitting: boolean
  hasPayments: boolean
}) {
  const [akunId, setAkunId] = useState("")
  const [namaTagihan, setNamaTagihan] = useState("")
  const [jumlah, setJumlah] = useState<string>("")
  
  // Format currency
  const formatRupiah = (val: string) => {
    const number_string = val.replace(/[^,\d]/g, '').toString()
    const split = number_string.split(',')
    const sisa = split[0].length % 3
    let rupiah = split[0].substr(0, sisa)
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi)

    if (ribuan) {
      const separator = sisa ? '.' : ''
      rupiah += separator + ribuan.join('.')
    }
    return rupiah ? rupiah : ''
  }

  // Set default values when modal opens or editingCol changes
  useEffect(() => {
    if (isOpen && editingCol) {
      setAkunId(editingCol.akunId)
      setNamaTagihan(editingCol.nama)
      setJumlah(formatRupiah(editingCol.jumlah?.toString() || "0"))
    }
  }, [isOpen, editingCol])

  if (!isOpen || !editingCol) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      akunId,
      namaTagihan,
      jumlah: parseFloat(jumlah.replace(/[^0-9]/g, '')) || 0
    })
  }

  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '')
    if (!rawVal) {
      setJumlah("")
      return
    }
    setJumlah(formatRupiah(rawVal))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Edit2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Edit Tagihan Massal</h2>
              <p className="text-xs text-text-muted">Ubah properti kolom tagihan untuk subkelas ini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:bg-bg rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {hasPayments && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm flex gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <div>
                <strong>Perhatian:</strong> Terdapat siswa yang sudah mencicil/melunasi tagihan ini. 
                Sesuai standar akuntansi, Bapak tidak dapat mengubah <strong>Akun Keuangan</strong> agar data kas/jurnal tetap sinkron. 
                Bapak tetap dapat mengubah <strong>Nama Tagihan</strong> dan <strong>Nominal Tagihan</strong>.
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Tagihan</label>
            <input 
              required
              type="text"
              placeholder="Contoh: SPP Juli 2026"
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={namaTagihan}
              onChange={(e) => setNamaTagihan(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Akun Keuangan (Pendapatan)</label>
            <select 
              required
              disabled={hasPayments}
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:bg-gray-100 disabled:cursor-not-allowed text-text-main"
              value={akunId}
              onChange={(e) => setAkunId(e.target.value)}
            >
              <option value="" disabled>Pilih akun pendapatan...</option>
              {akunPendapatanList.map((akun) => (
                <option key={akun.id} value={akun.id}>
                  {akun.kode} - {akun.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Nominal Tagihan Baru</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-text-muted">Rp</span>
              <input 
                required
                type="text"
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-semibold"
                value={jumlah}
                onChange={handleJumlahChange}
              />
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Nominal baru hanya akan diterapkan pada siswa yang belum pernah membayar cicilan sama sekali (Status BELUM_LUNAS).
            </p>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting} isLoading={isSubmitting}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

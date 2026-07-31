"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function ModalTambahTagihan({ 
  isOpen, 
  onClose,
  onSubmit,
  tahunAkademikList,
  akunPendapatanList,
  kelasName,
  subKelasName,
  isSubmitting
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { tahunAkademikId: string, akunId: string, jumlah: number }) => void
  tahunAkademikList: any[]
  akunPendapatanList: any[]
  kelasName: string
  subKelasName: string
  isSubmitting: boolean
}) {
  const [tahunAkademikId, setTahunAkademikId] = useState("")
  const [akunId, setAkunId] = useState("")
  const [jumlah, setJumlah] = useState<string>("0")

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      tahunAkademikId,
      akunId,
      jumlah: parseFloat(jumlah.replace(/[^0-9]/g, '')) || 0
    })
  }

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

  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJumlah(formatRupiah(e.target.value))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text-main">Tambah Tagihan Siswa</h2>
            <p className="text-sm text-text-muted mt-1">Perhatikan kembali saat mengisi data Tagihan siswa</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:bg-bg rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-sm font-semibold text-text-main">Pilih Tahun Akademik</label>
              <select 
                className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                value={tahunAkademikId}
                onChange={e => setTahunAkademikId(e.target.value)}
                required
              >
                <option value="" disabled>-- Pilih Tahun Akademik --</option>
                {tahunAkademikList.map(ta => (
                  <option key={ta.id} value={ta.id}>{ta.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-sm font-semibold text-text-main">Pilih Kode Akun</label>
              <select 
                className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                value={akunId}
                onChange={e => setAkunId(e.target.value)}
                required
              >
                <option value="" disabled>Pilih Kode Akun (Pendapatan)</option>
                {akunPendapatanList.map(akun => (
                  <option key={akun.id} value={akun.id}>[{akun.kode}] {akun.nama}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-sm font-semibold text-text-main">Kelas</label>
              <input 
                type="text" 
                value={kelasName} 
                disabled 
                className="w-full px-4 py-2 bg-gray-50 border border-border rounded-xl text-sm font-medium text-text-muted cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-sm font-semibold text-text-main">Subkelas</label>
              <input 
                type="text" 
                value={subKelasName} 
                disabled 
                className="w-full px-4 py-2 bg-gray-50 border border-border rounded-xl text-sm font-medium text-text-muted cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-[200px_1fr] items-center gap-4 pt-2">
              <label className="text-sm font-semibold text-text-main">Jumlah Tagihan</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">Rp.</span>
                <input 
                  type="text" 
                  className="w-full pl-12 pr-4 py-2 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold"
                  value={jumlah}
                  onChange={handleJumlahChange}
                  required
                />
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
            >
              Tutup
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

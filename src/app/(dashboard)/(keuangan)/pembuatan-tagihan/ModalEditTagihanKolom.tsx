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
  
  const [sppMonth, setSppMonth] = useState("")
  const [sppYear, setSppYear] = useState(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`)
  
  const selectedAkunIsSPP = akunPendapatanList.find(a => a.id === akunId)?.isSPP || false
  
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
      
      const isSppAcc = akunPendapatanList.find(a => a.id === editingCol.akunId)?.isSPP
      if (isSppAcc) {
        const months = ["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"]
        const foundMonth = months.find(m => editingCol.nama.includes(m))
        if (foundMonth) {
          setSppMonth(foundMonth)
        }
        
        // Coba cari tahun periode (misal: 2025/2026) atau tahun tunggal
        const yearPeriodMatch = editingCol.nama.match(/\b20\d{2}\/20\d{2}\b/g)
        if (yearPeriodMatch && yearPeriodMatch.length > 0) {
          setSppYear(yearPeriodMatch[0])
        } else {
          const yearMatch = editingCol.nama.match(/\b20\d{2}\b/g)
          if (yearMatch && yearMatch.length > 0) {
            setSppYear(yearMatch[0])
          }
        }
      }
    }
  }, [isOpen, editingCol, akunPendapatanList])

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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          {hasPayments && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm flex gap-3 mb-6">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <div>
                <strong>Perhatian:</strong> Terdapat siswa yang sudah mencicil/melunasi tagihan ini. 
                Sesuai standar akuntansi, Bapak tidak dapat mengubah <strong>Akun Keuangan</strong> agar data kas/jurnal tetap sinkron. 
                Bapak tetap dapat mengubah <strong>Nama Tagihan</strong> dan <strong>Nominal Tagihan</strong>.
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-sm font-semibold text-text-main">Akun Keuangan (Pendapatan)</label>
              <select 
                required
                disabled={hasPayments}
                className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-medium text-text-main"
                value={akunId}
                onChange={(e) => setAkunId(e.target.value)}
              >
                <option value="" disabled>Pilih akun pendapatan...</option>
                {akunPendapatanList.map((akun) => (
                  <option key={akun.id} value={akun.id}>
                    [{akun.kode}] {akun.nama}
                  </option>
                ))}
              </select>
            </div>

            {selectedAkunIsSPP && (
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4">
                <label className="text-sm font-semibold text-text-main mt-2">Bulan Tagihan (SPP)</label>
                <div className="flex gap-2">
                  <select 
                    className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                    value={sppMonth}
                    onChange={(e) => {
                      const newMonth = e.target.value
                      setSppMonth(newMonth)
                      
                      if (sppMonth && namaTagihan.includes(sppMonth)) {
                        setNamaTagihan(namaTagihan.replace(sppMonth, newMonth))
                      } else {
                        setNamaTagihan(`SPP ${newMonth} ${sppYear}`)
                      }
                    }}
                  >
                    <option value="" disabled>Pilih Bulan</option>
                    {["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <select 
                    className="w-36 px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                    value={sppYear}
                    onChange={(e) => {
                      const newYear = e.target.value
                      setSppYear(newYear)
                      
                      if (sppYear && namaTagihan.includes(sppYear)) {
                        setNamaTagihan(namaTagihan.replace(sppYear, newYear))
                      } else {
                        setNamaTagihan(`SPP ${sppMonth} ${newYear}`)
                      }
                    }}
                  >
                    {[-1, 0, 1].map(offset => {
                      const yr1 = new Date().getFullYear() + offset
                      const yr2 = yr1 + 1
                      const period = `${yr1}/${yr2}`
                      return <option key={period} value={period}>{period}</option>
                    })}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-sm font-semibold text-text-main">Nama Tagihan</label>
              <input 
                required
                type="text"
                placeholder="Contoh: Uang Gedung Cicilan 1"
                className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium text-text-main"
                value={namaTagihan}
                onChange={(e) => setNamaTagihan(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4 border-t border-border pt-4">
              <label className="text-sm font-semibold text-text-main mt-2">Nominal Tagihan Baru</label>
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-text-muted">Rp</span>
                  <input 
                    required
                    type="text"
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-semibold text-text-main"
                    value={jumlah}
                    onChange={handleJumlahChange}
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted leading-relaxed">
                  Nominal baru hanya akan diterapkan pada siswa yang belum pernah membayar cicilan sama sekali (Status BELUM_LUNAS).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={isSubmitting} isLoading={isSubmitting}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

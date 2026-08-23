"use client"

import { useState, useEffect } from "react"
import { X, Users, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function ModalTambahTagihan({ 
  isOpen, 
  onClose,
  onSubmit,
  akunPendapatanList,
  kelasList,
  subKelasList,
  gridData,
  activeKelasId,
  activeSubKelasId,
  isSubmitting
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { 
    akunId: string, 
    jumlah: number,
    targetType: "tingkat" | "kelas" | "murid",
    tingkatId?: string,
    subKelasId?: string,
    muridIds?: string[]
  }) => void
  akunPendapatanList: any[]
  kelasList: any[]
  subKelasList: any[]
  gridData: any[]
  activeKelasId: string
  activeSubKelasId: string
  isSubmitting: boolean
}) {
  const [akunId, setAkunId] = useState("")
  const [jumlah, setJumlah] = useState<string>("0")
  
  const [targetType, setTargetType] = useState<"tingkat" | "kelas" | "murid">("kelas")
  const [selectedTingkatId, setSelectedTingkatId] = useState(activeKelasId)
  const [selectedSubKelasId, setSelectedSubKelasId] = useState(activeSubKelasId)
  const [selectedMuridIds, setSelectedMuridIds] = useState<string[]>([])

  // Reset to default active ids when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTingkatId(activeKelasId)
      setSelectedSubKelasId(activeSubKelasId)
      setTargetType("kelas")
      setSelectedMuridIds([])
      setAkunId("")
      setJumlah("0")
    }
  }, [isOpen, activeKelasId, activeSubKelasId])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (targetType === "murid" && selectedMuridIds.length === 0) {
      alert("Pilih minimal 1 murid")
      return
    }

    onSubmit({
      akunId,
      jumlah: parseFloat(jumlah.replace(/[^0-9]/g, '')) || 0,
      targetType,
      tingkatId: targetType === "tingkat" ? selectedTingkatId : undefined,
      subKelasId: targetType === "kelas" ? selectedSubKelasId : undefined,
      muridIds: targetType === "murid" ? selectedMuridIds : undefined
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

  const toggleMurid = (id: string) => {
    setSelectedMuridIds(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const toggleAllMurid = () => {
    if (selectedMuridIds.length === gridData.length) {
      setSelectedMuridIds([])
    } else {
      setSelectedMuridIds(gridData.map(g => g.id))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-text-main">Tambah Tagihan Siswa</h2>
            <p className="text-sm text-text-muted mt-1">Buat tagihan secara massal atau spesifik</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:bg-bg rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4 pt-4 border-t border-border">
              <label className="text-sm font-semibold text-text-main mt-2">Target Penagihan</label>
              <div className="space-y-4">
                <div className="flex bg-bg p-1 rounded-xl w-fit">
                  <button 
                    type="button"
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${targetType === "tingkat" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-main"}`}
                    onClick={() => setTargetType("tingkat")}
                  >
                    1 Tingkatan
                  </button>
                  <button 
                    type="button"
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${targetType === "kelas" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-main"}`}
                    onClick={() => setTargetType("kelas")}
                  >
                    1 Rombel (Kelas)
                  </button>
                  <button 
                    type="button"
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${targetType === "murid" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-main"}`}
                    onClick={() => setTargetType("murid")}
                  >
                    Per Murid Spesifik
                  </button>
                </div>

                {targetType === "tingkat" && (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Users size={14} /> Tagihan akan digenerate untuk seluruh siswa di semua rombel pada tingkat ini.
                    </p>
                    <select 
                      className="w-full px-4 py-2 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                      value={selectedTingkatId}
                      onChange={e => setSelectedTingkatId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Pilih Tingkat...</option>
                      {kelasList.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === "kelas" && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Users size={14} /> Tagihan akan digenerate untuk seluruh siswa di Rombel yang dipilih.
                    </p>
                    <select 
                      className="w-full px-4 py-2 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                      value={selectedSubKelasId}
                      onChange={e => setSelectedSubKelasId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Pilih Subkelas (Rombel)...</option>
                      {subKelasList.map(sk => (
                        <option key={sk.id} value={sk.id}>{sk.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === "murid" && (
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <Users size={14} /> Pilih siswa spesifik di dalam rombel aktif Anda ({subKelasList.find(s => s.id === activeSubKelasId)?.name}).
                    </p>
                    
                    <div className="bg-white border border-border rounded-lg max-h-[200px] overflow-y-auto">
                      <div className="sticky top-0 bg-gray-50 border-b border-border px-3 py-2 flex items-center gap-2 cursor-pointer" onClick={toggleAllMurid}>
                        {selectedMuridIds.length === gridData.length && gridData.length > 0 ? (
                          <CheckSquare className="text-primary" size={18} />
                        ) : (
                          <Square className="text-text-muted" size={18} />
                        )}
                        <span className="text-sm font-semibold text-text-main">
                          Pilih Semua ({selectedMuridIds.length} / {gridData.length})
                        </span>
                      </div>
                      <div className="p-1">
                        {gridData.length === 0 && (
                          <div className="p-4 text-center text-sm text-text-muted">Tidak ada siswa.</div>
                        )}
                        {gridData.map(m => (
                          <div 
                            key={m.id} 
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                            onClick={() => toggleMurid(m.id)}
                          >
                            {selectedMuridIds.includes(m.id) ? (
                              <CheckSquare className="text-primary flex-shrink-0" size={18} />
                            ) : (
                              <Square className="text-text-muted flex-shrink-0" size={18} />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-main truncate">{m.name}</p>
                              <p className="text-xs text-text-muted truncate">NISN: {m.nisn}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4 pt-4 border-t border-border">
              <label className="text-sm font-semibold text-text-main">Jumlah Tagihan</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">Rp.</span>
                <input 
                  type="text" 
                  className="w-full pl-12 pr-4 py-2 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold text-text-main"
                  value={jumlah}
                  onChange={handleJumlahChange}
                  required
                />
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border flex-shrink-0">
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
              {isSubmitting ? "Menyimpan..." : "Buat Tagihan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

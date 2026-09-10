"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Users, CheckSquare, Square, Receipt } from "lucide-react"
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
    namaTagihan: string,
    jumlah: number,
    targetType: "tingkat" | "kelas" | "murid",
    tingkatId?: string,
    subKelasId?: string,
    muridIds?: string[],
    isSPP?: boolean,
    sppMonths?: string[],
    sppYear?: string
  }) => void
  akunPendapatanList: any[]
  kelasList: any[]
  subKelasList: any[]
  gridData: any[]
  activeKelasId: string
  activeSubKelasId: string
  isSubmitting: boolean
}) {
  const [mounted, setMounted] = useState(false)
  const [akunId, setAkunId] = useState("")
  const [namaTagihan, setNamaTagihan] = useState("")
  const [jumlah, setJumlah] = useState<string>("")
  
  const [targetType, setTargetType] = useState<"tingkat" | "kelas" | "murid">("kelas")
  const [selectedTingkatId, setSelectedTingkatId] = useState(activeKelasId)
  const [selectedSubKelasId, setSelectedSubKelasId] = useState(activeSubKelasId)
  const [selectedMuridIds, setSelectedMuridIds] = useState<string[]>([])
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`)

  const selectedAkun = akunPendapatanList.find(a => a.id === akunId)
  const isSPP = selectedAkun?.isSPP || false

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  // Reset to default active ids when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTingkatId(activeKelasId)
      setSelectedSubKelasId(activeSubKelasId)
      setTargetType("kelas")
      setSelectedMuridIds([])
      setAkunId("")
      setNamaTagihan("")
      setJumlah("")
      setSelectedMonths([])
      setSelectedYear(new Date().getFullYear().toString())
    }
  }, [isOpen, activeKelasId, activeSubKelasId])

  if (!isOpen || !mounted) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (targetType === "murid" && selectedMuridIds.length === 0) {
      alert("Pilih minimal 1 murid")
      return
    }

    if (isSPP && selectedMonths.length === 0) {
      alert("Pilih minimal 1 bulan untuk tagihan SPP")
      return
    }

    onSubmit({
      akunId,
      namaTagihan: namaTagihan,
      jumlah: parseFloat(jumlah.replace(/[^0-9]/g, '')) || 0,
      targetType,
      tingkatId: targetType === "tingkat" ? selectedTingkatId : undefined,
      subKelasId: targetType === "kelas" ? selectedSubKelasId : undefined,
      muridIds: targetType === "murid" ? selectedMuridIds : undefined,
      isSPP,
      sppMonths: isSPP ? selectedMonths : undefined,
      sppYear: isSPP ? selectedYear : undefined
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
    const rawVal = e.target.value.replace(/[^0-9]/g, '')
    if (!rawVal) {
      setJumlah("")
      return
    }
    setJumlah(formatRupiah(parseInt(rawVal, 10).toString()))
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[calc(100dvh-32px)] animate-in fade-in zoom-in-95 duration-200 z-10"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-bg/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Receipt size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-albas-green m-0 leading-tight truncate">Tambah Tagihan Siswa</h2>
              <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 leading-relaxed truncate sm:whitespace-normal">Buat tagihan secara massal atau spesifik</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer"
            type="button"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

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

            {isSPP && (
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4">
                <label className="text-sm font-semibold text-text-main mt-2">Bulan Tagihan (SPP)</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                      <select 
                        className="w-36 px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                      >
                        {[-1, 0, 1].map(offset => {
                          const yr1 = new Date().getFullYear() + offset
                          const yr2 = yr1 + 1
                          const period = `${yr1}/${yr2}`
                          return <option key={period} value={period}>{period}</option>
                        })}
                      </select>
                    <span className="text-xs text-text-muted">Pilih satu atau beberapa bulan di tahun ini:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"].map(bulan => (
                      <label key={bulan} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${selectedMonths.includes(bulan) ? 'bg-primary/5 border-primary/30' : 'border-border hover:bg-bg'}`}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-primary rounded"
                          checked={selectedMonths.includes(bulan)}
                          onChange={e => {
                            if (e.target.checked) setSelectedMonths([...selectedMonths, bulan])
                            else setSelectedMonths(selectedMonths.filter(m => m !== bulan))
                          }}
                        />
                        <span className="text-sm font-medium text-text-main">{bulan}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4">
              <label className="text-sm font-semibold text-text-main mt-2">
                {isSPP ? "Awalan Nama Tagihan" : "Nama Tagihan"}
              </label>
              <div>
                <input 
                  type="text"
                  placeholder={isSPP ? "Contoh: SPP Kelas 1" : "Contoh: Uang Gedung Cicilan 1"}
                  className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium text-text-main placeholder-text-muted/50"
                  value={namaTagihan}
                  onChange={e => setNamaTagihan(e.target.value)}
                  required
                />
                {isSPP && (
                  <p className="mt-2 text-xs text-text-muted">
                    Nama akhir tagihan akan di-generate secara otomatis menjadi: <br/>
                    <strong>{namaTagihan || "SPP"} [Bulan] {selectedYear}</strong> <br/>
                    (Misal: <em>{namaTagihan || "SPP"} Juli {selectedYear}</em>)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4 pt-4 border-t border-border">
              <label className="text-sm font-semibold text-text-main mt-2">Target Penagihan</label>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:flex bg-bg p-1 rounded-xl w-full sm:w-fit gap-1">
                  <button 
                    type="button"
                    className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors min-h-[38px] ${targetType === "tingkat" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-main"}`}
                    onClick={() => setTargetType("tingkat")}
                  >
                    1 Tingkatan
                  </button>
                  <button 
                    type="button"
                    className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors min-h-[38px] ${targetType === "kelas" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-main"}`}
                    onClick={() => setTargetType("kelas")}
                  >
                    1 Rombel (Kelas)
                  </button>
                  <button 
                    type="button"
                    className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors min-h-[38px] ${targetType === "murid" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-main"}`}
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

          <div className="shrink-0 p-4 sm:p-5 border-t border-border bg-surface/95 backdrop-blur-md flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] font-semibold"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-white font-bold w-full sm:w-auto min-h-[44px] shadow-sm shadow-primary/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Buat Tagihan"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

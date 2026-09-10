"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import { reactivateSiswa } from "@/actions/siswa"

export default function ReactivateSiswaModal({
  isOpen,
  onClose,
  muridId,
  muridName,
  academicYears,
  classrooms,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  muridId: string | null
  muridName: string
  academicYears: any[]
  classrooms: any[]
  onSuccess: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tahunAkademikId, setTahunAkademikId] = useState("")
  const [subKelasId, setSubKelasId] = useState("")

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

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen || !mounted || !muridId) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tahunAkademikId) return toast.error("Pilih Tahun Akademik terlebih dahulu")
    if (!subKelasId) return toast.error("Pilih Rombel / Kelas Tujuan terlebih dahulu")

    setIsSubmitting(true)
    try {
      await reactivateSiswa(muridId, subKelasId, tahunAkademikId)
      toast.success("Berhasil mengaktifkan kembali siswa!")
      setTahunAkademikId("")
      setSubKelasId("")
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat mengaktifkan siswa")
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div 
        className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[calc(100dvh-32px)]"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-bg/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <RefreshCw size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-albas-green m-0 leading-tight truncate">Aktifkan Kembali</h2>
              <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 leading-relaxed truncate sm:whitespace-normal">Reaktivasi siswa pindahan/alumni</p>
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
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 sm:p-4">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nama Siswa</label>
              <div className="font-semibold text-gray-900 text-sm sm:text-base">{muridName}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Tahun Akademik Tujuan <span className="text-red-500">*</span></label>
              <select
                required
                className="w-full px-4 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all"
                value={tahunAkademikId}
                onChange={(e) => setTahunAkademikId(e.target.value)}
              >
                <option value="" disabled>-- Pilih Tahun Akademik --</option>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Rombel Tujuan <span className="text-red-500">*</span></label>
              <select
                required
                className="w-full px-4 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all"
                value={subKelasId}
                onChange={(e) => setSubKelasId(e.target.value)}
              >
                <option value="" disabled>-- Pilih Rombel --</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="shrink-0 p-4 sm:p-5 border-t border-border bg-surface/95 backdrop-blur-md flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px] font-semibold">
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-primary hover:bg-primary/90 text-white font-bold w-full sm:w-auto min-h-[44px] shadow-sm shadow-primary/20">
              Aktifkan Siswa
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

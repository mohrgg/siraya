"use client"

import { useState } from "react"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tahunAkademikId, setTahunAkademikId] = useState("")
  const [subKelasId, setSubKelasId] = useState("")

  if (!isOpen || !muridId) return null

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-text-main tracking-tight">Aktifkan Kembali</h2>
              <p className="text-xs text-text-muted mt-0.5">Reaktivasi siswa pindahan/alumni</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nama Siswa</label>
              <div className="font-semibold text-gray-900">{muridName}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Tahun Akademik Tujuan <span className="text-red-500">*</span></label>
              <select
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all"
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
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all"
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

          <div className="p-6 border-t border-border bg-gray-50/50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Aktifkan Siswa
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

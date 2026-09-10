"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, Edit2, Trash2, CheckCircle2, Search, Calendar, 
  Sparkles, Layers, Receipt, ShieldAlert, ArrowUpRight, Zap
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { Modal } from "@/components/ui/Modal"
import { TabNavigation } from "@/components/ui/TabNavigation"
import { TableScrollHint } from "@/components/ui/TableScrollHint"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { 
  tambahTahunAkademik, 
  editTahunAkademik, 
  hapusTahunAkademik,
  setActiveTahunAkademik 
} from "@/actions/tahun-akademik"
import toast from "react-hot-toast"

export type AcademicYear = {
  id: string
  name: string
  isActive: boolean
  isDeleted: boolean
  createdAt: Date
  _count?: {
    subKelas: number
    tagihan: number
  }
}

export default function TahunAkademikClient({ 
  initialData, 
  userRole 
}: { 
  initialData: AcademicYear[]
  userRole?: string 
}) {
  const router = useRouter()
  const isReadOnly = userRole !== "ADMIN"
  const [data, setData] = useState<AcademicYear[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const filteredData = data.filter((d: AcademicYear) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData)

  // Active Year Cockpit Item
  const activeYear = data.find(d => d.isActive)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const currentYear = new Date().getFullYear()
  const PRESETS = Array.from({ length: 6 }).map((_, i) => {
    const year = currentYear - 2 + i
    return `${year}/${year + 1}`
  })

  const [formData, setFormData] = useState({ id: "", name: "", isActive: false })
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[2])
  const [isCustom, setIsCustom] = useState(false)

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Activation State
  const [activateId, setActivateId] = useState<string | null>(null)
  const [isActivating, setIsActivating] = useState(false)

  const handleOpenAddModal = () => {
    setFormData({ id: "", name: PRESETS[2], isActive: false })
    setSelectedPreset(PRESETS[2])
    setIsCustom(false)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: AcademicYear) => {
    setFormData({ id: item.id, name: item.name, isActive: item.isActive })
    if (PRESETS.includes(item.name)) {
      setSelectedPreset(item.name)
      setIsCustom(false)
    } else {
      setSelectedPreset("CUSTOM")
      setIsCustom(true)
    }
    setIsModalOpen(true)
  }

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedPreset(val)
    if (val === "CUSTOM") {
      setIsCustom(true)
      setFormData(prev => ({ ...prev, name: "" }))
    } else {
      setIsCustom(false)
      setFormData(prev => ({ ...prev, name: val }))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusTahunAkademik(deleteId)
      setData(prev => prev.filter(d => d.id !== deleteId))
      setDeleteId(null)
      toast.success("Tahun akademik berhasil dihapus.")
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus tahun akademik.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleActivateConfirm = async () => {
    if (!activateId) return
    setIsActivating(true)
    try {
      const res = await setActiveTahunAkademik(activateId)
      setData(prev => prev.map(d => ({
        ...d,
        isActive: d.id === activateId
      })))
      setActivateId(null)
      toast.success(`Tahun akademik ${res.name} kini aktif sebagai periode operasional utama yayasan!`)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Gagal mengaktifkan tahun akademik.")
    } finally {
      setIsActivating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (isCustom) {
      const pattern = /^\d{4}\/\d{4}$/
      if (!pattern.test(formData.name)) {
        toast.error("Format tahun manual harus YYYY/YYYY (contoh: 2025/2026).")
        setIsSubmitting(false)
        return
      }
    }

    const academicName = formData.name

    try {
      if (formData.id) {
        const res = await editTahunAkademik(formData.id, { name: academicName, isActive: formData.isActive })
        setData(prev => prev.map(d => {
          if (d.id === formData.id) return { ...d, name: academicName, isActive: formData.isActive }
          if (formData.isActive && d.id !== formData.id) {
            return { ...d, isActive: false }
          }
          return d
        }))
        toast.success("Tahun akademik berhasil diperbarui.")
      } else {
        const res = await tambahTahunAkademik({ name: academicName, isActive: formData.isActive })
        let newData = [...data]
        if (formData.isActive) {
          newData = newData.map(d => ({ ...d, isActive: false }))
        }
        setData([res as any, ...newData])
        toast.success("Tahun akademik baru berhasil ditambahkan.")
      }
      setIsModalOpen(false)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan tahun akademik.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Tahun Akademik"
        message="Apakah Anda yakin ingin menghapus tahun akademik ini? Sistem akan menolak penghapusan jika tahun ini sudah digunakan oleh data kelas atau siswa."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* 1-Click Activate Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!activateId}
        title="Aktifkan Tahun Akademik"
        message="Apakah Anda yakin ingin mengaktifkan tahun akademik ini sebagai periode operasional berjalan? Seluruh data modul kelas, pembuatan tagihan, dan pembayaran akan diarahkan ke tahun akademik ini."
        onCancel={() => setActivateId(null)}
        onConfirm={handleActivateConfirm}
        isLoading={isActivating}
        confirmText="Jadikan Aktif"
        confirmVariant="primary"
      />

      {/* Add / Edit Academic Year Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? "Edit Tahun Akademik" : "Tambah Tahun Akademik Baru"}
        subtitle="Konfigurasi tahun ajaran dan penentuan tahun operasional sistem"
        icon={Calendar}
        widthClassName="max-w-lg"
        footer={
          <>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)} 
              className="w-full sm:w-auto min-h-[44px] font-semibold"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              form="form-tahun-akademik" 
              isLoading={isSubmitting} 
              className="w-full sm:w-auto min-h-[44px] font-bold shadow-sm shadow-primary/20"
            >
              {formData.id ? "Simpan Perubahan" : "Simpan Tahun Ajaran"}
            </Button>
          </>
        }
      >
        <div className="mb-5 p-3.5 bg-amber-50/80 border border-amber-100 rounded-xl text-xs text-amber-800 flex gap-2.5 items-center">
          <Sparkles size={16} className="text-amber-600 shrink-0" />
          <div>Tahun akademik yang diset <b>Aktif</b> akan menjadi tahun berjalan utama sistem secara global.</div>
        </div>

        <form id="form-tahun-akademik" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Pilih Tahun Ajaran <span className="text-rose-500">*</span></label>
            <select 
              className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium text-sm"
              value={selectedPreset}
              onChange={handlePresetChange}
            >
              {PRESETS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="CUSTOM">-- Ketik Manual (Lainnya) --</option>
            </select>
          </div>

          {isCustom && (
            <div className="flex flex-col gap-1.5 p-4 bg-bg/60 rounded-xl border border-border mt-1">
              <label className="text-xs font-semibold text-text-main">Input Tahun Manual (Format: YYYY/YYYY) <span className="text-rose-500">*</span></label>
              <input 
                type="text"
                placeholder="Contoh: 2026/2027"
                className="w-full px-3.5 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium text-sm"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <span className="text-[11px] text-text-muted">Gunakan pemisah garis miring (/)</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input 
              type="checkbox" 
              id="isActive" 
              checked={formData.isActive} 
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })} 
              className="w-4 h-4 accent-primary rounded cursor-pointer" 
            />
            <label htmlFor="isActive" className="font-semibold cursor-pointer text-text-main text-sm">
              Jadikan Sebagai Tahun Aktif Berjalan
            </label>
          </div>
        </form>
      </Modal>

      {/* BANNER TAHUN AJARAN AKTIF */}
      {activeYear ? (
        <div className="rounded-2xl bg-surface border border-emerald-500/30 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Tahun Ajaran Operasional Aktif</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight flex items-center gap-2.5 mt-1">
                <Calendar className="text-emerald-600 shrink-0" size={26} />
                <span>{activeYear.name}</span>
              </h2>
            </div>

            {/* Live KPI mini-counters for active year */}
            <div className="grid grid-cols-2 sm:flex items-center gap-3">
              <div className="px-4 py-2.5 bg-bg rounded-xl border border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Layers size={18} />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-text-main">{activeYear._count?.subKelas || 0}</p>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Rombel Aktif</p>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-bg rounded-xl border border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Receipt size={18} />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-text-main">{activeYear._count?.tagihan || 0}</p>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Tagihan Tercatat</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex items-center gap-3 text-amber-800">
          <ShieldAlert size={24} className="shrink-0 text-amber-600" />
          <div className="text-sm">
            <strong>Peringatan Sistem:</strong> Belum ada tahun akademik yang diset aktif. Silakan pilih salah satu tahun di bawah dan klik <b>"Jadikan Aktif"</b> untuk memastikan sistem beroperasi normal.
          </div>
        </div>
      )}

      {/* Main Unified Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <TabNavigation
          tabs={[{ id: "tahun", label: "Daftar Tahun Akademik", icon: Calendar, badge: initialData.length }]}
        />

        {/* Toolbar: Search & Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center flex-1 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cari tahun ajaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
              />
            </div>
          </div>

          {!isReadOnly && (
            <div className="shrink-0 w-full sm:w-auto">
              <Button onClick={handleOpenAddModal} className="w-full sm:w-auto flex items-center justify-center bg-primary text-white hover:bg-primary/90 shadow-sm">
                <Plus size={16} className="mr-1.5" />
                <span>Tambah Tahun Akademik</span>
              </Button>
            </div>
          )}
        </div>

        {/* Detail Table */}
        <TableScrollHint totalRows={sortedData.length} />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 text-center w-12 font-semibold">NO</th>
                <SortableHeader label="TAHUN AKADEMIK" sortKey="name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-left" />
                <th className="p-4 text-center font-semibold">ROMBEL TERHUBUNG</th>
                <th className="p-4 text-center font-semibold">DATA TAGIHAN</th>
                <SortableHeader label="STATUS OPERASIONAL" sortKey="isActive" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-left" />
                {!isReadOnly && <th className="p-4 font-semibold text-right">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {sortedData.map((item, index) => (
                <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4 text-center font-medium text-text-muted">{index + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${item.isActive ? "bg-emerald-600 text-white shadow-xs" : "bg-bg text-text-muted border border-border"}`}>
                        <Calendar size={14} />
                      </div>
                      <span className="font-bold text-text-main text-base">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                      <Layers size={12} />
                      {item._count?.subKelas || 0} Kelas
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Receipt size={12} />
                      {item._count?.tagihan || 0} Data
                    </span>
                  </td>
                  <td className="p-4">
                    {item.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-extrabold">
                        <CheckCircle2 size={13} />
                        <span>Tahun Berjalan (Aktif)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-bg text-text-muted rounded-full text-xs font-medium border border-border">
                        Tidak Aktif
                      </span>
                    )}
                  </td>
                  {!isReadOnly && (
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* 1-Click Activate Button */}
                        {!item.isActive && (
                          <button
                            type="button"
                            onClick={() => setActivateId(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                            title="Aktifkan sebagai tahun berjalan utama"
                          >
                            <Zap size={13} />
                            <span>Jadikan Aktif</span>
                          </button>
                        )}

                        <button 
                          onClick={() => handleOpenEditModal(item)} 
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 hover:border-emerald-600 transition-colors" 
                          title="Edit Tahun Akademik"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(item.id)} 
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" 
                          title="Hapus Tahun Akademik"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="p-8">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      <Calendar size={40} className="text-gray-300 mb-3" />
                      <p className="font-medium text-text-main mb-1">Belum ada data...</p>
                      <p className="text-xs">Cobalah mencari dengan kata kunci lain atau tambahkan tahun akademik baru.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

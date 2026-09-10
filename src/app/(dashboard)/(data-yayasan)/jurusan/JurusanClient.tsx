"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, Edit2, Trash2, BookOpen, Search, 
  School, Layers, CheckCircle2, ChevronRight,
  Filter, Sparkles, Users
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { DeleteWarningModal } from "@/components/ui/DeleteWarningModal"
import { Modal } from "@/components/ui/Modal"
import { TabNavigation } from "@/components/ui/TabNavigation"
import { TableScrollHint } from "@/components/ui/TableScrollHint"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { tambahJurusan, editJurusan, hapusJurusan } from "@/actions/kelas"
import toast from "react-hot-toast"

export type Major = {
  id: string
  name: string
  code: string
  unitSekolahId: string
  isDeleted: boolean
  unitSekolah?: {
    id: string
    name: string
    level: string
  }
  _count?: {
    subKelas: number
  }
}

export default function JurusanClient({ 
  initialData, 
  userRole, 
  activeUnitId, 
  units = [] 
}: { 
  initialData: Major[]
  userRole?: string
  activeUnitId?: string
  units?: any[] 
}) {
  const router = useRouter()
  const isReadOnly = userRole !== "ADMIN" && userRole !== "TATA_USAHA"
  const [data, setData] = useState<Major[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")

  // Quick Filter Pill State for "Semua Unit (Konsolidasi)" mode
  const [selectedPillUnitId, setSelectedPillUnitId] = useState<string>("all")

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Custom Preset Logic
  const PRESETS = [
    { code: "UMUM", name: "Umum / Reguler" },
    { code: "MIPA", name: "Matematika dan Ilmu Pengetahuan Alam (SMA)" },
    { code: "IPS", name: "Ilmu Pengetahuan Sosial (SMA)" },
    { code: "BAHASA", name: "Ilmu Bahasa dan Budaya (SMA)" },
    { code: "MPLB", name: "Manajemen Perkantoran dan Layanan Bisnis (SMK)" },
    { code: "AKL", name: "Akuntansi dan Keuangan Lembaga (SMK)" },
    { code: "PM", name: "Bisnis Daring Dan Pemasaran / Pemasaran (SMK)" },
    { code: "TKJ", name: "Teknik Jaringan Komputer dan Telekomunikasi (SMK)" },
    { code: "RPL", name: "Pengembangan Perangkat Lunak dan Gim (SMK)" },
    { code: "DKV", name: "Desain Komunikasi Visual (SMK)" },
    { code: "PH", name: "Perhotelan (SMK)" },
  ]
  const [selectedPreset, setSelectedPreset] = useState("UMUM")
  const [isCustom, setIsCustom] = useState(false)

  const defaultUnit = activeUnitId || (units.length > 0 ? units[0].id : "")
  const [formData, setFormData] = useState({ 
    id: "", 
    name: "", 
    code: "", 
    unitSekolahId: defaultUnit 
  })

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter Data by Search Term and Pill
  const filteredData = data.filter((d: Major) => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.unitSekolah?.name && d.unitSekolah.name.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    // If activeUnitId is set in navbar, data is already unit-scoped
    if (activeUnitId) return true

    // If in "Semua Unit" consolidation, apply pill filter
    if (selectedPillUnitId !== "all") {
      return d.unitSekolahId === selectedPillUnitId
    }

    return true
  })

  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData)

  // Level Badge Helper
  const getLevelBadge = (level?: string) => {
    const l = (level || "").toUpperCase()
    if (l === "SD" || l === "MI") {
      return "bg-blue-50 text-blue-700 border-blue-200"
    } else if (l === "SMP" || l === "MTS") {
      return "bg-violet-50 text-violet-700 border-violet-200"
    } else if (l === "SMK") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    } else if (l === "SMA" || l === "MA") {
      return "bg-amber-50 text-amber-700 border-amber-200"
    }
    return "bg-slate-50 text-slate-700 border-slate-200"
  }

  const handleOpenAddModal = (presetUnitId?: string) => {
    const targetUnit = presetUnitId || (selectedPillUnitId !== "all" ? selectedPillUnitId : defaultUnit)
    setFormData({ 
      id: "", 
      name: PRESETS[0].name, 
      code: PRESETS[0].code, 
      unitSekolahId: targetUnit 
    })
    setSelectedPreset(PRESETS[0].code)
    setIsCustom(false)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: Major) => {
    setFormData({ 
      id: item.id, 
      name: item.name, 
      code: item.code, 
      unitSekolahId: item.unitSekolahId 
    })
    const matchedPreset = PRESETS.find(p => p.code === item.code && p.name === item.name)
    if (matchedPreset) {
      setSelectedPreset(matchedPreset.code)
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
      setFormData(prev => ({ ...prev, code: "", name: "" }))
    } else {
      setIsCustom(false)
      const p = PRESETS.find(x => x.code === val)
      if (p) setFormData(prev => ({ ...prev, code: p.code, name: p.name }))
    }
  }

  const majorToDelete = data.find(d => d.id === deleteId)
  const majorSubKelasCount = majorToDelete?._count?.subKelas || (majorToDelete as any)?.subKelas?.length || 0
  const majorMuridCount = (majorToDelete as any)?.subKelas?.reduce((acc: number, sk: any) => acc + (sk._count?.riwayatKelas || 0), 0) || 0
  const isMajorBlocked = majorSubKelasCount > 0 || majorMuridCount > 0

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    if (isMajorBlocked) {
      toast.error(`Tidak dapat menghapus jurusan "${majorToDelete?.name}" karena masih memiliki ${majorSubKelasCount} rombel dan ${majorMuridCount} siswa aktif.`)
      setDeleteId(null)
      return
    }
    setIsDeleting(true)
    try {
      await hapusJurusan(deleteId)
      setData(prev => prev.filter(d => d.id !== deleteId))
      setDeleteId(null)
      toast.success("Program / Jurusan berhasil dihapus.")
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus jurusan.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (!formData.unitSekolahId) {
        toast.error("Unit Sekolah wajib dipilih.")
        setIsSubmitting(false)
        return
      }

      if (formData.id) {
        const res = await editJurusan(formData.id, { 
          name: formData.name, 
          code: formData.code, 
          unitSekolahId: formData.unitSekolahId 
        })
        setData(prev => prev.map(d => d.id === formData.id ? (res as any) : d))
        toast.success("Jurusan berhasil diperbarui.")
      } else {
        const res = await tambahJurusan({ 
          name: formData.name, 
          code: formData.code, 
          unitSekolahId: formData.unitSekolahId 
        })
        setData(prev => [...prev, res as any])
        toast.success("Jurusan baru berhasil ditambahkan.")
      }
      setIsModalOpen(false)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan data jurusan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group data by Unit Sekolah for consolidated view
  const isConsolidatedView = !activeUnitId
  const unitsToDisplay = isConsolidatedView
    ? units.filter(u => selectedPillUnitId === "all" || u.id === selectedPillUnitId)
    : units.filter(u => u.id === activeUnitId)

  return (
    <div className="space-y-6">
      {/* Standardized Delete Warning / Confirmation Modal */}
      <DeleteWarningModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        entityType="Program / Jurusan"
        entityName={`${majorToDelete?.name || ""} (${majorToDelete?.code || ""})`}
        unitName={units.find(u => u.id === majorToDelete?.unitSekolahId)?.name || (majorToDelete as any)?.unitSekolah?.name}
        isBlocked={isMajorBlocked}
        dependencies={[
          ...(majorSubKelasCount > 0 ? [{
            label: "Rombel / Kelas Terkait",
            count: majorSubKelasCount,
            icon: <Layers size={14} className="text-primary" />,
            variant: "warning" as const
          }] : []),
          ...(majorMuridCount > 0 ? [{
            label: "Siswa Aktif Terdaftar",
            count: majorMuridCount,
            icon: <Users size={14} className="text-rose-600" />,
            variant: "danger" as const
          }] : [])
        ]}
        blockedTitle="Jurusan Tidak Dapat Dihapus"
        blockedMessage={`Program/Jurusan "${majorToDelete?.name || ''}" saat ini masih terhubung dengan rombel atau siswa aktif.`}
        blockedSolution="Pindahkan atau mutasikan seluruh siswa dan rombel yang terhubung dengan jurusan ini terlebih dahulu sebelum menghapusnya."
        confirmTitle="Hapus Program / Jurusan?"
        confirmMessage={`Apakah Anda yakin ingin menghapus program / jurusan "${majorToDelete?.name || ''}" (${majorToDelete?.code || ''})? Data jurusan yang kosong akan dihapus permanen.`}
        confirmButtonText="Hapus Jurusan"
      />

      {/* Add / Edit Major Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? "Edit Program / Jurusan" : "Tambah Program / Jurusan Baru"}
        subtitle="Konfigurasi kompetensi keahlian dan peminatan kurikulum unit sekolah"
        icon={BookOpen}
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
              form="form-jurusan" 
              isLoading={isSubmitting} 
              className="w-full sm:w-auto min-h-[44px] font-bold shadow-sm shadow-primary/20"
            >
              {formData.id ? "Simpan Perubahan" : "Simpan Jurusan"}
            </Button>
          </>
        }
      >
        <div className="mb-5 p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-800 flex gap-2.5 items-center">
          <Sparkles size={16} className="text-blue-600 shrink-0" />
          <div>Jurusan ini hanya akan muncul saat mengelola rombel / kelas pada unit sekolah yang bersangkutan.</div>
        </div>

        <form id="form-jurusan" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Unit Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">
              Unit Sekolah {activeUnitId ? "(Terkunci Sesuai Navigasi)" : <span className="text-rose-500">*</span>}
            </label>
            {activeUnitId ? (
              <div className="px-3.5 py-2.5 bg-bg/80 border border-border rounded-xl text-sm font-bold text-text-main flex items-center justify-between">
                <span>{units.find(u => u.id === activeUnitId)?.name || "Unit Terpilih"}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Terkunci</span>
              </div>
            ) : (
              <select 
                className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium text-sm"
                value={formData.unitSekolahId || defaultUnit}
                onChange={e => setFormData({ ...formData, unitSekolahId: e.target.value })}
                required
              >
                {units.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.level})</option>
                ))}
              </select>
            )}
          </div>
          
          {/* Preset Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Preset Kompetensi / Jurusan</label>
            <select 
              className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium text-sm"
              value={selectedPreset}
              onChange={handlePresetChange}
            >
              {PRESETS.map(p => (
                <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
              ))}
              <option value="CUSTOM">-- Ketik Manual (Kustom / Lainnya) --</option>
            </select>
          </div>

          {/* Custom Input */}
          {isCustom && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-bg/60 rounded-xl border border-border mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-main">Kode (ex: DKV)</label>
                <Input 
                  value={formData.code} 
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                  maxLength={20} 
                  required 
                  placeholder="Kode"
                />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-main">Nama Lengkap Jurusan</label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  maxLength={100} 
                  required 
                  placeholder="Contoh: Desain Komunikasi Visual"
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Main Unified Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <TabNavigation
          tabs={[{ id: "jurusan", label: "Daftar Program / Jurusan", icon: BookOpen, badge: data.length }]}
        />

        {/* Quick Filter Pills (Khusus Mode Konsolidasi Semua Unit) */}
        {isConsolidatedView && units.length > 0 && (
          <div className="mb-6 pb-4 border-b border-border/70">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-text-muted uppercase tracking-wider">
              <Filter size={13} />
              <span>Pill Filter Unit Sekolah:</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => setSelectedPillUnitId("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedPillUnitId === "all"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-bg text-text-muted hover:text-text-main hover:bg-gray-100 border border-border"
                }`}
              >
                <span>Semua Unit</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedPillUnitId === "all" ? "bg-white/20 text-white" : "bg-border text-text-muted"}`}>
                  {data.length}
                </span>
              </button>

              {units.map((u) => {
                const count = data.filter(d => d.unitSekolahId === u.id).length
                const isSelected = selectedPillUnitId === u.id
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedPillUnitId(u.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white shadow-xs"
                        : "bg-bg text-text-muted hover:text-text-main hover:bg-gray-100 border border-border"
                    }`}
                  >
                    <span>{u.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-border text-text-muted"}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Toolbar: Search & Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center flex-1 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cari kode atau nama jurusan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
              />
            </div>
          </div>

          {!isReadOnly && (
            <div className="shrink-0 w-full sm:w-auto">
              <Button 
                onClick={() => handleOpenAddModal()} 
                className="w-full sm:w-auto flex items-center justify-center bg-primary text-white hover:bg-primary/90 shadow-sm"
              >
                <Plus size={16} className="mr-1.5" />
                <span>Tambah Program/Jurusan</span>
              </Button>
            </div>
          )}
        </div>

        {/* GROUPED PER-UNIT SECTIONS */}
        <div className="space-y-6">
          {unitsToDisplay.map((unit) => {
            const unitMajors = sortedData.filter(d => d.unitSekolahId === unit.id)
            if (selectedPillUnitId !== "all" && selectedPillUnitId !== unit.id) return null
            if (searchTerm && unitMajors.length === 0) return null

            const badgeStyle = getLevelBadge(unit.level)

            return (
              <div 
                key={unit.id}
                className="bg-surface rounded-2xl border border-border overflow-hidden shadow-2xs"
              >
                {/* Unit Header Bar */}
                <div className="px-5 py-4 bg-bg/50 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <School size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-text-main">{unit.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${badgeStyle}`}>
                          {unit.level}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {unitMajors.length} Program / Jurusan terdaftar pada unit ini
                      </p>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(unit.id)}
                      className="text-xs font-bold text-primary hover:text-primary/80 inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer self-start sm:self-auto border border-primary/20"
                    >
                      <Plus size={14} />
                      <span>Tambah Jurusan di Unit Ini</span>
                    </button>
                  )}
                </div>

                {/* Table for this Unit */}
                <div className="p-3 sm:p-0">
                  <TableScrollHint totalRows={unitMajors.length} />
                  <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
                    <thead className="border-b border-border bg-bg/30 text-text-muted text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5 text-center w-12 font-semibold">NO</th>
                        <th className="p-3.5 font-semibold">KODE PROGRAM</th>
                        <th className="p-3.5 font-semibold">NAMA KOMPETENSI KEAHLIAN / JURUSAN</th>
                        <th className="p-3.5 text-center font-semibold">ROMBEL TERHUBUNG</th>
                        {!isReadOnly && <th className="p-3.5 font-semibold text-right">AKSI</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {unitMajors.map((item, index) => (
                        <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                          <td className="p-3.5 text-center font-medium text-text-muted">{index + 1}</td>
                          <td className="p-3.5">
                            <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-bg border border-border text-text-main">
                              {item.code}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-text-main block">{item.name}</span>
                            {item.code === "UMUM" && (
                              <span className="text-[11px] text-text-muted font-normal">
                                Jurusan kurikulum umum / standar kelas
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                              <Layers size={12} />
                              {item._count?.subKelas || 0} Kelas
                            </span>
                          </td>
                          {!isReadOnly && (
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => handleOpenEditModal(item)} 
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 hover:border-emerald-600 transition-colors" 
                                  title="Edit Jurusan"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button 
                                  onClick={() => setDeleteId(item.id)} 
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" 
                                  title="Hapus Jurusan"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}

                      {unitMajors.length === 0 && (
                        <tr>
                          <td colSpan={isReadOnly ? 4 : 5} className="p-6 text-center text-text-muted text-xs">
                            Belum ada program/jurusan yang ditambahkan pada unit ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            )
          })}

          {sortedData.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-text-muted bg-surface rounded-2xl border border-border">
              <BookOpen size={40} className="text-gray-300 mb-3" />
              <p className="font-medium text-text-main mb-1">Belum ada data program / jurusan...</p>
              <p className="text-xs">Cobalah mencari dengan kata kunci lain atau pilih unit sekolah lain.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

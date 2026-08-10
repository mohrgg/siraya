"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, BookOpen, Search } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { Modal } from "@/components/ui/Modal"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { tambahJurusan, editJurusan, hapusJurusan } from "@/actions/kelas"
import toast from "react-hot-toast"

type Major = any

export default function JurusanClient({ initialData, units, userRole }: { initialData: Major[], units: any[], userRole?: string }) {
  const isReadOnly = false
  const isUnitLocked = !["ADMIN", "KEPALA_SEKOLAH"].includes(userRole || "")
  const [activeUnitId, setActiveUnitId] = useState<string>(units[0]?.id || "")
  const [data, setData] = useState<Major[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  
  const filteredData = data.filter((d: any) => 
    d.unitSekolahId === activeUnitId &&
    (d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     d.code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData)
  const [isAdding, setIsAdding] = useState(false)
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

  const [formData, setFormData] = useState({ id: "", name: "", code: "", unitSekolahId: activeUnitId })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddClick = () => {
    setFormData({ id: "", name: PRESETS[0].name, code: PRESETS[0].code, unitSekolahId: activeUnitId })
    setSelectedPreset(PRESETS[0].code)
    setIsCustom(false)
    setIsAdding(true)
  }

  const handleEditClick = (item: Major) => {
    setFormData({ id: item.id, name: item.name, code: item.code, unitSekolahId: item.unitSekolahId })
    const matchedPreset = PRESETS.find(p => p.code === item.code && p.name === item.name)
    if (matchedPreset) {
      setSelectedPreset(matchedPreset.code)
      setIsCustom(false)
    } else {
      setSelectedPreset("CUSTOM")
      setIsCustom(true)
    }
    setIsAdding(true)
  }

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedPreset(val)
    if (val === "CUSTOM") {
      setIsCustom(true)
      setFormData({ ...formData, code: "", name: "" })
    } else {
      setIsCustom(false)
      const p = PRESETS.find(x => x.code === val)
      if (p) setFormData({ ...formData, code: p.code, name: p.name })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusJurusan(deleteId)
      setData(data.filter(d => d.id !== deleteId))
      setDeleteId(null)
      toast.success("Jurusan berhasil dihapus")
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus jurusan")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formData.id) {
        // Edit
        const res = await editJurusan(formData.id, { name: formData.name, code: formData.code, unitSekolahId: formData.unitSekolahId })
        const updatedUnit = units.find(u => u.id === formData.unitSekolahId)
        setData(data.map(d => d.id === formData.id ? { ...res, unitSekolah: updatedUnit } : d))
        toast.success("Jurusan berhasil diperbarui")
      } else {
        // Create
        const res = await tambahJurusan({ name: formData.name, code: formData.code, unitSekolahId: formData.unitSekolahId })
        const newUnit = units.find(u => u.id === formData.unitSekolahId)
        setData([...data, { ...res, unitSekolah: newUnit }])
        toast.success("Jurusan berhasil ditambahkan")
      }
      setIsAdding(false)
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan jurusan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Jurusan"
        message="Apakah Anda yakin ingin menghapus jurusan ini? Pastikan jurusan ini belum digunakan pada data kelas atau murid."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      <Modal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title={formData.id ? "Edit Jurusan" : "Tambah Jurusan Baru"}
        subtitle="Daftar peminatan atau program studi vokasi untuk unit sekolah"
        icon={BookOpen}
        widthClassName="max-w-lg"
      >
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 flex gap-3">
          <div className="font-bold shrink-0">Catatan:</div>
          <div>Jurusan ini hanya akan muncul sebagai pilihan saat Anda membuat kelas pada <b>Unit Sekolah</b> yang bersangkutan.</div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 hidden">
            <label className="text-sm font-semibold text-text-main">Unit Sekolah <span className="text-red-500">*</span></label>
            <select 
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium"
              value={formData.unitSekolahId}
              onChange={e => setFormData({ ...formData, unitSekolahId: e.target.value })}
              required
            >
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Pilih Preset Jurusan / Program</label>
            <select 
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium"
              value={selectedPreset}
              onChange={handlePresetChange}
            >
              {PRESETS.map(p => (
                <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
              ))}
              <option value="CUSTOM">-- Ketik Manual (Lainnya) --</option>
            </select>
          </div>

          {isCustom && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 p-4 bg-gray-50 rounded-xl border border-border">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-main">Kode Jurusan (Cth: TKJ)</label>
                <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} maxLength={20} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-main">Nama Lengkap Jurusan</label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} maxLength={100} required />
              </div>
            </div>
          )}
          
          <div className="flex gap-3 mt-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Batal</Button>
            <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
          </div>
        </form>
      </Modal>

      <div className="space-y-6">
        <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden p-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-border">
            <button className="px-6 py-3 font-semibold text-sm border-b-2 border-primary text-primary transition-colors">
              Daftar Program / Jurusan
            </button>
          </div>

          {/* Top Filter & Toolbar */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              <div className="relative w-full md:w-44 flex-shrink-0">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari nama, kode jurusan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
                />
              </div>

              <select
                value={activeUnitId}
                onChange={(e) => setActiveUnitId(e.target.value)}
                disabled={isUnitLocked}
                className={`px-3 py-2 border rounded-xl focus:outline-none text-sm font-medium min-w-[180px] ${
                  isUnitLocked 
                    ? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200" 
                    : "cursor-pointer bg-bg border-border text-text-main focus:ring-2 focus:ring-primary/50"
                }`}
              >
                {units.map((unit: any) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>

            {!isReadOnly && (
              <div className="flex-shrink-0">
                <Button onClick={handleAddClick} className="flex items-center bg-primary text-white hover:bg-primary/90 shadow-sm">
                  <Plus size={16} className="mr-1.5" />
                  <span>Tambah Program/Jurusan</span>
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
                <tr>
                  <th className="p-4 font-semibold text-center w-12">NO</th>
                  <SortableHeader label="Kode Program" sortKey="code" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                  <SortableHeader label="Nama Program / Jurusan" sortKey="name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                  {!isReadOnly && <th className="p-4 font-semibold text-right">AKSI</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {sortedData.map((item, index) => (
                  <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-center font-medium text-text-muted">{index + 1}</td>
                    <td className="p-4 font-mono text-sm text-text-muted font-semibold">{item.code}</td>
                    <td className="p-4 font-bold text-text-main">{item.name}</td>
                    {!isReadOnly && (
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteId(item.id)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-border">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {sortedData.length === 0 && (
                  <tr>
                    <td colSpan={isReadOnly ? 3 : 4} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-text-muted">
                        <BookOpen className="w-12 h-12 stroke-[1.2] text-text-muted/40 mb-3" />
                        <p className="font-medium text-text-main mb-1">Tidak ada data ditemukan</p>
                        <p className="text-sm">Cobalah mencari dengan kata kunci lain atau pilih unit lain.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

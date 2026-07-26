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
  const isReadOnly = userRole === "KEPALA_SEKOLAH"
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

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
          {units.map((unit: any) => (
            <button
              key={unit.id}
              onClick={() => setActiveUnitId(unit.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeUnitId === unit.id ? 'bg-albas-green text-white shadow-md' : 'bg-surface text-text-muted hover:bg-gray-100 hover:text-text-main border border-border'}`}
            >
              {unit.name}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari jurusan..." 
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm text-text-main" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!isReadOnly && (
            <Button onClick={handleAddClick}>
              <Plus size={16} className="mr-2" /> Tambah Program/Jurusan
            </Button>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        {sortedData.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            {searchTerm ? "Tidak ada program/jurusan yang cocok dengan pencarian" : "Belum ada data program/jurusan. Silakan tambahkan data baru."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
                  <th className="p-4 font-semibold">No</th>
                  <SortableHeader label="Kode Program" sortKey="code" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                  <SortableHeader label="Nama Program / Jurusan" sortKey="name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                  {!isReadOnly && <th className="p-4 font-semibold text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-mono text-sm text-text-muted font-semibold">{item.code}</td>
                    <td className="p-4 font-bold text-text-main">{item.name}</td>
                    {!isReadOnly && (
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setDeleteId(item.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

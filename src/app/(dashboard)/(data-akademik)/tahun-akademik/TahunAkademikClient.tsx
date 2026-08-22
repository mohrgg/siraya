"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, CheckCircle2, Search, Calendar } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { Modal } from "@/components/ui/Modal"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { tambahTahunAkademik, editTahunAkademik, hapusTahunAkademik } from "@/actions/tahun-akademik"

type AcademicYear = any

export default function TahunAkademikClient({ initialData, userRole }: { initialData: AcademicYear[], userRole?: string }) {
  const router = useRouter()
  const isReadOnly = userRole !== "ADMIN"
  const [data, setData] = useState<AcademicYear[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  
  const filteredData = data.filter((d: any) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const currentYear = new Date().getFullYear()
  const PRESETS = Array.from({ length: 6 }).map((_, i) => {
    const year = currentYear - 2 + i
    return `${year}/${year + 1}`
  })

  const [formData, setFormData] = useState({ id: "", name: "", isActive: false })
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[2])
  const [isCustom, setIsCustom] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddClick = () => {
    setFormData({ id: "", name: PRESETS[2], isActive: false })
    setSelectedPreset(PRESETS[2])
    setIsCustom(false)
    setIsAdding(true)
  }

  const handleEditClick = (item: AcademicYear) => {
    setFormData({ id: item.id, name: item.name, isActive: item.isActive })
    if (PRESETS.includes(item.name)) {
      setSelectedPreset(item.name)
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
      setFormData({ ...formData, name: "" })
    } else {
      setIsCustom(false)
      setFormData({ ...formData, name: val })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusTahunAkademik(deleteId)
      setData(data.filter(d => d.id !== deleteId))
      setDeleteId(null)
    } catch (e: any) {
      alert("Gagal menghapus data: " + e.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (isCustom) {
      const pattern = /^\d{4}\/\d{4}$/
      if (!pattern.test(formData.name)) {
        alert("Format tahun akademik manual salah. Gunakan format YYYY/YYYY (contoh: 2024/2025).")
        setIsSubmitting(false)
        return
      }
    }

    const academicName = formData.name

    try {
      if (formData.id) {
        await editTahunAkademik(formData.id, { name: academicName, isActive: formData.isActive })
        setData(data.map(d => {
          if (d.id === formData.id) return { ...d, name: academicName, isActive: formData.isActive }
          if (formData.isActive && d.id !== formData.id) {
            return { ...d, isActive: false }
          }
          return d
        }))
      } else {
        const res = await tambahTahunAkademik({ name: academicName, isActive: formData.isActive })
        let newData = [...data]
        if (formData.isActive) {
          newData = newData.map(d => ({ ...d, isActive: false }))
        }
        setData([res, ...newData])
      }
      setIsAdding(false)
      if (formData.isActive) {
        router.refresh()
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Tahun Akademik"
        message="Apakah Anda yakin ingin menghapus tahun akademik ini? Jika sudah digunakan pada data tagihan atau murid, mungkin akan ditolak oleh sistem."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      <Modal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title={formData.id ? "Edit Tahun Akademik" : "Tambah Tahun Akademik Baru"}
        subtitle="Konfigurasi tahun ajaran dan penentuan tahun berjalan utama"
        icon={Calendar}
        widthClassName="max-w-lg"
      >
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800 flex gap-3">
          <div className="font-bold shrink-0">Catatan:</div>
          <div>Tahun akademik yang diset "Aktif" akan menjadi tahun berjalan utama sistem (ditampilkan otomatis).</div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Pilih Tahun Akademik <span className="text-red-500">*</span></label>
            <select 
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium"
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
            <div className="flex flex-col gap-1.5 p-4 bg-gray-50 rounded-xl border border-border mt-1">
              <label className="text-sm font-semibold text-text-main">Input Tahun Manual <span className="text-red-500">*</span></label>
              <input 
                type="text"
                placeholder="Contoh: 2024/2025"
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <span className="text-xs text-text-muted">Gunakan format YYYY/YYYY</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 accent-albas-green" />
            <label htmlFor="isActive" className="font-semibold cursor-pointer text-text-main text-sm">Jadikan Aktif (Tahun Berjalan)</label>
          </div>
          
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
              Daftar Tahun Akademik
            </button>
          </div>

          {/* Top Filter & Toolbar */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              <div className="relative w-full md:w-44 flex-shrink-0">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari tahun akademik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
                />
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex-shrink-0">
                <Button onClick={handleAddClick} className="flex items-center bg-primary text-white hover:bg-primary/90 shadow-sm">
                  <Plus size={16} className="mr-1.5" />
                  <span>Tambah Tahun Akademik</span>
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
                <tr>
                  <th className="p-4 font-semibold text-center w-12">NO</th>
                  <SortableHeader label="Tahun Akademik" sortKey="name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                  <SortableHeader label="Status" sortKey="isActive" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                  {!isReadOnly && <th className="p-4 font-semibold text-right">AKSI</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {sortedData.map((item, index) => (
                  <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-center font-medium text-text-muted">{index + 1}</td>
                    <td className="p-4 font-semibold text-text-main">{item.name}</td>
                    <td className="p-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                          <CheckCircle2 size={14} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-text-muted rounded-full text-xs font-bold">
                          Tidak Aktif
                        </span>
                      )}
                    </td>
                    {!isReadOnly && (
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditClick(item)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-600 transition-colors" title="Edit Tahun Akademik">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" title="Hapus Tahun Akademik">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {sortedData.length === 0 && (
                  <tr>
                    <td colSpan={isReadOnly ? 3 : 4} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-text-muted">
                        <Calendar className="w-12 h-12 stroke-[1.2] text-text-muted/40 mb-3" />
                        <p className="font-medium text-text-main mb-1">Tidak ada data ditemukan</p>
                        <p className="text-sm">Cobalah mencari dengan kata kunci lain.</p>
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

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, CheckCircle2, Search } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { tambahTahunAkademik, editTahunAkademik, hapusTahunAkademik } from "@/actions/tahun-akademik"

type AcademicYear = any

export default function TahunAkademikClient({ initialData }: { initialData: AcademicYear[] }) {
  const router = useRouter()
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

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-border flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg rounded-t-2xl">
              <h3 className="text-xl font-bold text-albas-green m-0">{formData.id ? "Edit Tahun Akademik" : "Tambah Tahun Akademik Baru"}</h3>
              <button onClick={() => setIsAdding(false)} className="text-2xl text-text-muted hover:text-text-main transition-colors">&times;</button>
            </div>
            <div className="p-6">
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
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Cari tahun akademik..." 
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm text-text-main" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleAddClick}>
          <Plus size={16} className="mr-2" /> Tambah Tahun Akademik
        </Button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        {sortedData.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            {searchTerm ? "Tidak ada tahun akademik yang cocok dengan pencarian" : "Belum ada data Tahun Akademik."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
                  <th className="p-4 font-semibold">No</th>
                  <SortableHeader label="Tahun Akademik" sortKey="name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                  <SortableHeader label="Status" sortKey="isActive" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                  <th className="p-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">{index + 1}</td>
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

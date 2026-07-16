"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { tambahTahunAkademik, editTahunAkademik, hapusTahunAkademik } from "@/actions/tahun-akademik"

type AcademicYear = any
type SchoolUnit = any

export default function TahunAkademikClient({ initialData }: { initialData: AcademicYear[] }) {
  const [data, setData] = useState<AcademicYear[]>(initialData)
  
  // Sync state when initialData changes due to global unit filter
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({ id: "", name: "", isActive: false })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddClick = () => {
    setFormData({ id: "", name: "", isActive: false })
    setIsAdding(true)
  }

  const handleEditClick = (item: AcademicYear) => {
    setFormData({ id: item.id, name: item.name, isActive: item.isActive })
    setIsAdding(true)
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
    try {
      if (formData.id) {
        // Edit
        await editTahunAkademik(formData.id, { name: formData.name, isActive: formData.isActive })
        // Optimistic update
        setData(data.map(d => {
          if (d.id === formData.id) return { ...d, name: formData.name, isActive: formData.isActive }
          // if this is set to active, deactivate all others globally
          if (formData.isActive && d.id !== formData.id) {
            return { ...d, isActive: false }
          }
          return d
        }))
      } else {
        // Create
        const res = await tambahTahunAkademik({ name: formData.name, isActive: formData.isActive })
        
        let newData = [...data]
        if (formData.isActive) {
          newData = newData.map(d => ({ ...d, isActive: false }))
        }
        setData([res, ...newData])
      }
      setIsAdding(false)
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
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-border flex flex-col">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-text-main">{formData.id ? "Edit Tahun Akademik" : "Tambah Tahun Akademik Baru"}</h3>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800 flex gap-3">
                <div className="font-bold shrink-0">Catatan:</div>
                <div>Tahun akademik yang diset "Aktif" akan menjadi tahun berjalan utama sistem (ditampilkan otomatis).</div>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Nama Tahun Akademik (Cth: 2025/2026)</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
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

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-albas-green">Manajemen Tahun Akademik</h2>
        </div>

        <Button onClick={handleAddClick} className="mb-6">
          <Plus size={16} className="mr-2"/> Tambah Tahun Akademik
        </Button>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">TAHUN AKADEMIK</th>
                <th className="p-4 font-semibold">STATUS</th>
                <th className="p-4 font-semibold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
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
              {data.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-text-muted">
                    Belum ada data Tahun Akademik.
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

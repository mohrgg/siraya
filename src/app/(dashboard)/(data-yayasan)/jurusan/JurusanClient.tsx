"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, BookOpen, Search } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { tambahJurusan, editJurusan, hapusJurusan } from "@/actions/kelas"

type Major = any

export default function JurusanClient({ initialData }: { initialData: Major[] }) {
  const [data, setData] = useState<Major[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  
  const filteredData = data.filter((d: any) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ id: "", name: "", code: "" })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddClick = () => {
    setFormData({ id: "", name: "", code: "" })
    setIsAdding(true)
  }

  const handleEditClick = (item: Major) => {
    setFormData({ id: item.id, name: item.name, code: item.code })
    setIsAdding(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusJurusan(deleteId)
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
        const res = await editJurusan(formData.id, { name: formData.name, code: formData.code })
        setData(data.map(d => d.id === formData.id ? res : d))
      } else {
        // Create
        const res = await tambahJurusan({ name: formData.name, code: formData.code })
        setData([...data, res])
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
        title="Hapus Jurusan"
        message="Apakah Anda yakin ingin menghapus jurusan ini? Pastikan jurusan ini belum digunakan pada data kelas atau murid."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-border flex flex-col">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-text-main">{formData.id ? "Edit Jurusan" : "Tambah Jurusan Baru"}</h3>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800 flex gap-3">
                <div className="font-bold shrink-0">Tips:</div>
                <div>Untuk level unit sekolah yang tidak memiliki penjurusan (misal: SD, SMP), Anda bisa membuat satu jurusan dengan kode "UMUM" dan nama "Umum".</div>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Kode Jurusan (Cth: TKJ)</label>
                  <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} maxLength={20} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Nama Lengkap Jurusan (Cth: Teknik Komputer Jaringan)</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} maxLength={100} required />
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
            placeholder="Cari jurusan..." 
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm text-text-main" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleAddClick}>
          <Plus size={16} className="mr-2" /> Tambah Program/Jurusan
        </Button>
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
                  <th className="p-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-mono text-sm text-text-muted font-semibold">{item.code}</td>
                    <td className="p-4 font-bold text-text-main">{item.name}</td>
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

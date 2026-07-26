"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Edit2, Plus, Building, Trash2 } from "lucide-react"
import { tambahUnitSekolah, editUnitSekolah, hapusUnitSekolah } from "@/actions/unit-sekolah"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"

type UnitSekolah = { id: string, name: string, level: string, address: string | null, phone: string | null, logo?: string | null, isActive: boolean, createdAt?: Date, updatedAt?: Date }

export default function UnitSekolahClient({ initialData, userRole }: { initialData: UnitSekolah[], userRole?: string }) {
  const router = useRouter()
  const isReadOnly = userRole === "KEPALA_SEKOLAH"
  const [data, setData] = useState<UnitSekolah[]>(initialData)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ id: "", name: "", level: "SD", address: "", phone: "", isActive: true })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (item: any) => {
    setFormData({ id: item.id, name: item.name, level: item.level || "SD", address: item.address || "", phone: item.phone || "", isActive: item.isActive })
    setIsAdding(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusUnitSekolah(deleteId)
      setData(data.filter(d => d.id !== deleteId))
      setDeleteId(null)
    } catch (err: any) {
      alert("Gagal menghapus data: " + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formData.id) {
        // Update
        const res = await editUnitSekolah(formData.id, { 
          name: formData.name, 
          level: formData.level,
          address: formData.address,
          phone: formData.phone,
          isActive: formData.isActive
        })
        setData(data.map(d => d.id === formData.id ? res : d))
      } else {
        // Create
        const res = await tambahUnitSekolah({ 
          name: formData.name, 
          level: formData.level,
          address: formData.address,
          phone: formData.phone
        })
        setData([...data, res])
      }
      setIsAdding(false)
      setFormData({ id: "", name: "", level: "SD", address: "", phone: "", isActive: true })
    } catch (err: any) { alert(err.message) }
    setIsSubmitting(false)
  }

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Unit Sekolah"
        message="Apakah Anda yakin ingin menghapus unit sekolah ini? Semua data terkait (kelas, murid) mungkin akan terpengaruh jika tidak ada constraint cascade delete."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      <Modal
        isOpen={isAdding}
        onClose={() => { setIsAdding(false); setFormData({ id: "", name: "", level: "SD", address: "", phone: "", isActive: true }) }}
        title={formData.id ? "Edit Unit Sekolah" : "Tambah Unit Sekolah Baru"}
        subtitle="Kelola identitas dan jenjang pendidikan unit sekolah yayasan"
        icon={Building}
        widthClassName="max-w-lg"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Nama Unit</label>
            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="ex: SMK Al Basyariah" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Level</label>
            <select className="w-full px-3 py-2 bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} required>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="SMK">SMK</option>
              <option value="MI">MI</option>
              <option value="MTs">MTs</option>
              <option value="MA">MA</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Telepon (Opsional)</label>
            <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="ex: 021-123456" />
          </div>
          {formData.id && (
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 accent-albas-green" />
              <label htmlFor="isActive" className="font-semibold cursor-pointer text-text-main text-sm">Unit Aktif</label>
            </div>
          )}
          
          <div className="flex gap-3 mt-4 justify-end">
            <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setFormData({ id: "", name: "", level: "SD", address: "", phone: "", isActive: true }) }}>Batal</Button>
            <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
          </div>
        </form>
      </Modal>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-albas-green">Manajemen Unit Sekolah</h2>
        </div>

        {!isReadOnly && (
          <Button onClick={() => setIsAdding(true)} className="mb-6">
            <Plus size={16} className="mr-2"/> Tambah Unit Sekolah
          </Button>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">NAMA UNIT</th>
                <th className="p-4 font-semibold">LEVEL</th>
                <th className="p-4 font-semibold">TELEPON</th>
                <th className="p-4 font-semibold">STATUS</th>
                {!isReadOnly && <th className="p-4 font-semibold text-right">AKSI</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <Building size={20} />
                    </div>
                    <span className="font-semibold text-text-main">{item.name}</span>
                  </td>
                  <td className="p-4 text-text-main font-medium">{item.level}</td>
                  <td className="p-4 text-text-muted">{item.phone || "-"}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {item.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  {!isReadOnly && (
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
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
              {data.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 4 : 5} className="p-8 text-center text-text-muted">
                    Belum ada data Unit Sekolah.
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

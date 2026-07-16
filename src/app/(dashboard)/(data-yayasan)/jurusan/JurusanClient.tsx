"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { tambahJurusan, editJurusan, hapusJurusan } from "@/actions/kelas"

type Major = any

export default function JurusanClient({ initialData }: { initialData: Major[] }) {
  const [data, setData] = useState<Major[]>(initialData)
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
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", backgroundColor: "var(--bg-color)" }}>
            <div className="card-header">
              <h3 className="card-title">{formData.id ? "Edit Jurusan" : "Tambah Jurusan Baru"}</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                <strong>Tips:</strong> Untuk level unit sekolah yang tidak memiliki penjurusan (misal: SD, SMP), Anda bisa membuat satu jurusan dengan kode "UMUM" dan nama "Umum".
              </div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Kode Jurusan (Cth: TKJ)</label>
                  <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} maxLength={20} required />
                </div>
                <div>
                  <label className="form-label">Nama Lengkap Jurusan (Cth: Teknik Komputer Jaringan)</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} maxLength={100} required />
                </div>
                
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Batal</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", color: "var(--albas-green)" }}>Manajemen Jurusan</h2>
        </div>

      <Button onClick={() => setIsAdding(true)} style={{ marginBottom: "1.5rem" }}>
        <Plus size={16} style={{ marginRight: "0.5rem" }}/> Tambah Jurusan
      </Button>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)" }}>
              <th style={{ padding: "1rem" }}>KODE</th>
              <th style={{ padding: "1rem" }}>NAMA JURUSAN</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "1rem", fontWeight: 600 }}>{item.code}</td>
                <td style={{ padding: "1rem" }}>{item.name}</td>
                <td style={{ padding: "1rem", textAlign: "right" }}>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(item)} style={{ marginRight: "0.5rem" }}><Edit2 size={14} /></Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteId(item.id)}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Belum ada data Jurusan.
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

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
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", backgroundColor: "var(--bg-color)" }}>
            <div className="card-header">
              <h3 className="card-title">{formData.id ? "Edit Tahun Akademik" : "Tambah Tahun Akademik Baru"}</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                <strong>Catatan:</strong> Tahun akademik yang diset "Aktif" akan menjadi tahun berjalan utama sistem (ditampilkan otomatis).
              </div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Nama Tahun Akademik (Cth: 2025/2026)</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: "18px", height: "18px", accentColor: "var(--albas-green)" }} />
                  <label htmlFor="isActive" style={{ fontWeight: 600, color: "var(--text-main)", cursor: "pointer" }}>Jadikan Aktif (Tahun Berjalan)</label>
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
          <h2 style={{ fontSize: "1.25rem", color: "var(--albas-green)" }}>Manajemen Tahun Akademik</h2>
        </div>

      <Button onClick={() => setIsAdding(true)} style={{ marginBottom: "1.5rem" }}><Plus size={16} style={{ marginRight: "0.5rem" }}/> Tambah Tahun Akademik</Button>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              <th style={{ padding: "1rem" }}>TAHUN AKADEMIK</th>
              <th style={{ padding: "1rem" }}>STATUS</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "1rem", fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: "1rem" }}>
                  {item.isActive ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 12px", backgroundColor: "var(--sidebar-hover)", color: "var(--albas-green)", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 }}>
                      <CheckCircle2 size={14} /> Aktif
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 12px", backgroundColor: "var(--bg-color)", color: "var(--text-muted)", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 }}>
                      Tidak Aktif
                    </span>
                  )}
                </td>
                <td style={{ padding: "1rem", textAlign: "right" }}>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(item)} style={{ marginRight: "0.5rem" }}><Edit2 size={14} /></Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteId(item.id)}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
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

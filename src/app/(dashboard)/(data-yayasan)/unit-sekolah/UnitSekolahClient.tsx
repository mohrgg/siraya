"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Edit2, Plus, Building, Trash2 } from "lucide-react"
import { tambahUnitSekolah, editUnitSekolah, hapusUnitSekolah } from "@/actions/unit-sekolah"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { Input } from "@/components/ui/Input"

export default function UnitSekolahClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData)
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



      {isAdding && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", backgroundColor: "var(--bg-color)" }}>
            <div className="card-header">
              <h3 className="card-title">{formData.id ? "Edit Unit Sekolah" : "Tambah Unit Sekolah Baru"}</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Nama Unit</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="ex: SMK Al Basyariah" />
                </div>
                <div>
                  <label className="form-label">Level</label>
                  <select className="form-input" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} required>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="SMK">SMK</option>
                    <option value="MI">MI</option>
                    <option value="MTs">MTs</option>
                    <option value="MA">MA</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Telepon (Opsional)</label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="ex: 021-123456" />
                </div>
                {formData.id && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: "16px", height: "16px", accentColor: "var(--albas-green)" }} />
                    <label htmlFor="isActive" style={{ fontWeight: 600, cursor: "pointer" }}>Unit Aktif</label>
                  </div>
                )}
                
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
                  <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setFormData({ id: "", name: "", level: "SD", address: "", phone: "", isActive: true }) }}>Batal</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", color: "var(--albas-green)" }}>Manajemen Unit Sekolah</h2>
        </div>

      <Button onClick={() => setIsAdding(true)} style={{ marginBottom: "1.5rem" }}>
        <Plus size={16} style={{ marginRight: "0.5rem" }}/> Tambah Unit Sekolah
      </Button>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            <th style={{ padding: "1rem" }}>NAMA UNIT</th>
            <th style={{ padding: "1rem" }}>LEVEL</th>
            <th style={{ padding: "1rem" }}>TELEPON</th>
            <th style={{ padding: "1rem" }}>STATUS</th>
            <th style={{ padding: "1rem", textAlign: "right" }}>AKSI</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
              <td style={{ padding: "1rem", display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '8px', color: 'var(--albas-green)' }}>
                  <Building size={20} />
                </div>
                <span style={{ fontWeight: 600 }}>{item.name}</span>
              </td>
              <td style={{ padding: "1rem" }}>{item.level}</td>
              <td style={{ padding: "1rem" }}>{item.phone || "-"}</td>
              <td style={{ padding: "1rem" }}>
                <span className={`badge ${item.isActive ? 'badge-success' : 'badge-error'}`}>
                  {item.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </td>
              <td style={{ padding: "1rem", textAlign: "right" }}>
                <Button variant="outline" size="sm" onClick={() => handleEdit(item)} style={{ marginRight: "0.5rem" }}>
                  <Edit2 size={14} />
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteId(item.id)}>
                  <Trash2 size={14} />
                </Button>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Belum ada data Unit Sekolah.</td></tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { tambahTransaksiKas } from "@/actions/transaksi-kas"

export default function KasMasukClient({ 
  initialData, schoolUnits, initialUnitId, accounts, students 
}: { 
  initialData: any[], schoolUnits: any[], initialUnitId: string, accounts: any[], students: any[] 
}) {
  const [data, setData] = useState<any[]>(initialData)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [formData, setFormData] = useState({
    akunDetailId: "",
    unitSekolahId: initialUnitId,
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    studentName: "",
    formNo: "",
  })

  const filteredData = data.filter(d => 
    d.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await tambahTransaksiKas({
        type: "IN",
        akunDetailId: formData.akunDetailId,
        unitSekolahId: formData.unitSekolahId,
        amount: Number(formData.amount),
        date: new Date(formData.date),
        description: formData.description,
        studentName: formData.studentName,
        formNo: formData.formNo
      })
      setData([res, ...data])
      setIsAdding(false)
      setFormData({
        ...formData,
        amount: "",
        description: "",
        studentName: "",
        formNo: ""
      })
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format currency
  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num)
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ width: "300px", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "10px", top: "12px", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Cari referensi atau keterangan..." 
            className="form-input" 
            style={{ paddingLeft: "35px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus size={16} style={{ marginRight: "0.5rem" }} /> Input Kas Masuk
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", padding: "1.5rem", backgroundColor: "var(--bg-color)", borderRadius: "12px" }}>
          <div style={{ gridColumn: "span 2", fontWeight: 700, marginBottom: "0.5rem" }}>Input Transaksi Kas Masuk (Penerimaan)</div>
          
          <div>
            <label className="form-label">Tanggal Transaksi</label>
            <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Unit Sekolah</label>
            <select className="form-input" value={formData.unitSekolahId} onChange={e => setFormData({ ...formData, unitSekolahId: e.target.value })} required>
              {schoolUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label className="form-label">Akun Keuangan (Penerimaan)</label>
            <select className="form-input" value={formData.akunDetailId} onChange={e => setFormData({ ...formData, akunDetailId: e.target.value })} required>
              <option value="">-- Pilih Akun --</option>
              {accounts.map(a => <option key={a.id} value={a.id}>[{a.code}] {a.name} ({a.subKlasifikasiAkun.name})</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Jumlah (Rp)</label>
            <Input type="number" min="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Nomor Formulir (Opsional)</label>
            <Input value={formData.formNo} onChange={e => setFormData({ ...formData, formNo: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Nama Siswa / Penyetor (Opsional)</label>
            <input list="students" className="form-input" value={formData.studentName} onChange={e => setFormData({ ...formData, studentName: e.target.value })} />
            <datalist id="students">
              {students.filter(s => s.unitSekolahId === formData.unitSekolahId).map(s => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label className="form-label">Keterangan Tambahan</label>
            <textarea 
              className="form-input" 
              rows={3} 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              style={{ resize: "vertical" }}
            />
          </div>
          
          <div style={{ gridColumn: "span 2", display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button type="submit" isLoading={isSubmitting}>Simpan Transaksi</Button>
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Batal</Button>
          </div>
        </form>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)" }}>
              <th style={{ padding: "1rem" }}>Tanggal</th>
              <th style={{ padding: "1rem" }}>No Referensi</th>
              <th style={{ padding: "1rem" }}>Penyetor/Keterangan</th>
              <th style={{ padding: "1rem" }}>Akun</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>Nominal</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "1rem" }}>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                <td style={{ padding: "1rem", fontWeight: 600 }}>{item.referenceNo}</td>
                <td style={{ padding: "1rem" }}>
                  <div style={{ fontWeight: 600 }}>{item.studentName || item.recipientName || "-"}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{item.description}</div>
                </td>
                <td style={{ padding: "1rem" }}>
                  {item.akunDetail ? `[${item.akunDetail.code}] ${item.akunDetail.name}` : "-"}
                </td>
                <td style={{ padding: "1rem", textAlign: "right", fontWeight: 700, color: "var(--albas-green)" }}>
                  {formatRp(Number(item.amount))}
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Belum ada data Kas Masuk.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

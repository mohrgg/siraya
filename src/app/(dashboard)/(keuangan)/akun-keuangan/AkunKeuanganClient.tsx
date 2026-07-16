"use client"

import { useState } from "react"
import { Plus, Folder, FolderOpen, FileText } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { tambahKlasifikasiAkun, tambahSubKlasifikasiAkun, tambahAkunDetail } from "@/actions/akun-keuangan"

type Classification = any
type SchoolUnit = any

export default function AkunKeuanganClient({ 
  initialData, schoolUnits, initialUnitId 
}: { 
  initialData: Classification[], schoolUnits: SchoolUnit[], initialUnitId: string 
}) {
  const [data, setData] = useState<Classification[]>(initialData)
  
  // State form
  const [showAddClass, setShowAddClass] = useState(false)
  const [formClass, setFormClass] = useState({ name: "", unitSekolahId: initialUnitId })

  const [showAddSub, setShowAddSub] = useState(false)
  const [formSub, setFormSub] = useState({ name: "", code: "", klasifikasiAkunId: "" })

  const [showAddDetail, setShowAddDetail] = useState(false)
  const [formDetail, setFormDetail] = useState({ name: "", code: "", subKlasifikasiAkunId: "", bankAccountNumber: "" })

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await tambahKlasifikasiAkun(formClass)
      setData([...data, { ...res, subKlasifikasiAkun: [] }])
      setShowAddClass(false)
      setFormClass({ ...formClass, name: "" })
    } catch (err: any) { alert(err.message) }
  }

  const handleAddSub = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await tambahSubKlasifikasiAkun(formSub)
      setData(data.map(d => d.id === formSub.klasifikasiAkunId ? { ...d, subKlasifikasiAkun: [...(d.subKlasifikasiAkuns || []), { ...res, akunDetail: [] }] } : d))
      setShowAddSub(false)
      setFormSub({ ...formSub, name: "", code: "" })
    } catch (err: any) { alert(err.message) }
  }

  const handleAddDetail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await tambahAkunDetail(formDetail)
      setData(data.map(d => ({
        ...d,
        subKlasifikasiAkun: d.subKlasifikasiAkuns.map((s: any) => 
          s.id === formDetail.subKlasifikasiAkunId ? { ...s, akunDetail: [...(s.akunDetails || []), res] } : s
        )
      })))
      setShowAddDetail(false)
      setFormDetail({ ...formDetail, name: "", code: "", bankAccountNumber: "" })
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <Button onClick={() => setShowAddClass(true)}><Plus size={16} style={{ marginRight: "0.5rem" }} /> Klasifikasi Utama</Button>
        <Button variant="outline" onClick={() => setShowAddSub(true)}><Plus size={16} style={{ marginRight: "0.5rem" }} /> Sub Klasifikasi</Button>
        <Button variant="outline" onClick={() => setShowAddDetail(true)}><Plus size={16} style={{ marginRight: "0.5rem" }} /> Akun Detail</Button>
      </div>

      {showAddClass && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", borderLeft: "4px solid var(--albas-green)" }}>
          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--albas-green)" }}>Tambah Klasifikasi Utama Baru</h4>
          <form onSubmit={handleAddClass} className="inline-form" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "1rem", alignItems: "end" }}>
            <div>
              <Input label="Nama Klasifikasi (Cth: HARTA)" value={formClass.name} onChange={e => setFormClass({ ...formClass, name: e.target.value })} required />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", height: "46px", alignItems: "center" }}>
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddClass(false)}>Batal</Button>
            </div>
          </form>
        </div>
      )}

      {showAddSub && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", borderLeft: "4px solid var(--albas-green)" }}>
          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--albas-green)" }}>Tambah Sub Klasifikasi Baru</h4>
          <form onSubmit={handleAddSub} className="inline-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto auto", gap: "1rem", alignItems: "end" }}>
            <div className="form-group">
              <label className="form-label">Pilih Induk (Klasifikasi Utama)</label>
              <select className="form-input" value={formSub.klasifikasiAkunId} onChange={e => setFormSub({ ...formSub, klasifikasiAkunId: e.target.value })} required>
                <option value="">-- Pilih --</option>
                {data.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <Input label="Kode (Cth: 1.1)" value={formSub.code} onChange={e => setFormSub({ ...formSub, code: e.target.value })} required />
            </div>
            <div>
              <Input label="Nama Sub (Cth: KAS & BANK)" value={formSub.name} onChange={e => setFormSub({ ...formSub, name: e.target.value })} required />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", height: "46px", alignItems: "center" }}>
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddSub(false)}>Batal</Button>
            </div>
          </form>
        </div>
      )}

      {showAddDetail && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", borderLeft: "4px solid var(--albas-green)" }}>
          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--albas-green)" }}>Tambah Akun Detail Baru</h4>
          <form onSubmit={handleAddDetail} className="inline-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto auto", gap: "1rem", alignItems: "end" }}>
            <div className="form-group">
              <label className="form-label">Pilih Sub Klasifikasi</label>
              <select className="form-input" value={formDetail.subKlasifikasiAkunId} onChange={e => setFormDetail({ ...formDetail, subKlasifikasiAkunId: e.target.value })} required>
                <option value="">-- Pilih --</option>
                {data.flatMap(d => d.subKlasifikasiAkuns).map((s: any) => s && <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
              </select>
            </div>
            <div>
              <Input label="Kode Akun Detail (Cth: 1.1.01)" value={formDetail.code} onChange={e => setFormDetail({ ...formDetail, code: e.target.value })} required />
            </div>
            <div>
              <Input label="Nama Akun (Cth: Kas Kecil Tunai)" value={formDetail.name} onChange={e => setFormDetail({ ...formDetail, name: e.target.value })} required />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", height: "46px", alignItems: "center" }}>
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddDetail(false)}>Batal</Button>
            </div>
          </form>
        </div>
      )}

      <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        {data.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Belum ada data Chart of Accounts. Silakan mulai dengan membuat Klasifikasi Utama.</div>
        ) : (
          <div style={{ padding: "1rem" }}>
            {data.map(cls => (
              <div key={cls.id} style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--text-color)" }}>
                  <FolderOpen size={20} color="var(--albas-green)" /> {cls.name}
                </div>
                
                <div style={{ paddingLeft: "1.5rem" }}>
                  {cls.subKlasifikasiAkuns?.map((sub: any) => (
                    <div key={sub.id} style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-muted)" }}>
                        <Folder size={16} /> [{sub.code}] {sub.name}
                      </div>
                      
                      <div style={{ paddingLeft: "1.5rem" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            {sub.akunDetails?.map((acc: any) => (
                              <tr key={acc.id} style={{ borderBottom: "1px solid var(--bg-color)" }}>
                                <td style={{ padding: "0.5rem", width: "150px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <FileText size={14} color="var(--text-muted)" /> {acc.code}
                                  </div>
                                </td>
                                <td style={{ padding: "0.5rem" }}>{acc.name}</td>
                              </tr>
                            ))}
                            {(!sub.akunDetails || sub.akunDetails.length === 0) && (
                              <tr>
                                <td colSpan={2} style={{ padding: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                                  Belum ada akun detail di sub klasifikasi ini.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                  {(!cls.subKlasifikasiAkuns || cls.subKlasifikasiAkuns.length === 0) && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", paddingLeft: "1.5rem" }}>Belum ada sub klasifikasi.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

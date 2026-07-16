"use client"

import { useState, useEffect } from "react"
import { Search, FileSpreadsheet, FileIcon as FilePdf, Plus, Upload, Trash2, Edit2, Info } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { tambahKelas, tambahTingkatan, editKelas, hapusKelas, hapusTingkatan } from "@/actions/kelas"
import { tambahSiswa, editSiswa, hapusSiswa } from "@/actions/siswa"

export default function KelasClient({ 
  activeUnitId, initialGrades, initialMajors, initialClassrooms, initialStudents, academicYears, schoolUnits 
}: { 
  activeUnitId?: string, initialGrades: any[], initialMajors: any[], initialClassrooms: any[], initialStudents: any[], academicYears: any[], schoolUnits: any[] 
}) {
  const [activeTab, setActiveTab] = useState<"kelas" | "sub-kelas" | "murid">("kelas")

  // States
  const [grades, setGrades] = useState(initialGrades)
  const [classrooms, setClassrooms] = useState(initialClassrooms)
  const [students, setStudents] = useState(initialStudents)

  useEffect(() => {
    setGrades(initialGrades)
    setClassrooms(initialClassrooms)
    setStudents(initialStudents)

    const defaultUnit = activeUnitId || schoolUnits[0]?.id || ""
    setFormKelas(prev => ({ ...prev, unitSekolahId: defaultUnit }))
    setFormSubKelas(prev => ({ ...prev, unitSekolahId: defaultUnit }))
    setFormMurid((prev: any) => ({ ...prev, unitSekolahId: defaultUnit }))
  }, [initialGrades, initialClassrooms, initialStudents, activeUnitId, schoolUnits])
  
  // Modals
  const [showModalMurid, setShowModalMurid] = useState(false)
  const [showModalKelas, setShowModalKelas] = useState(false)
  const [showModalSubKelas, setShowModalSubKelas] = useState(false)
  
  // Confirm Delete Modal
  const [deleteData, setDeleteData] = useState<{ id: string, type: "tingkat" | "subkelas" | "murid" } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Forms
  const [formMurid, setFormMurid] = useState<any>({
    id: "", nisn: "", name: "", unitSekolahId: schoolUnits[0]?.id || "", subKelasId: "",
    previousSchool: "", phone: "", birthDate: "", email: "", studentStatus: "Aktif",
    parentName: "", parentPhone: "", religion: "Islam", gender: "Laki-laki",
    address: "", formNo: "", username: ""
  })
  const [formKelas, setFormKelas] = useState({ id: "", name: "", order: 1, unitSekolahId: schoolUnits[0]?.id || "" })
  const [formSubKelas, setFormSubKelas] = useState({ id: "", name: "", tingkatId: "", jurusanId: initialMajors[0]?.id || "", tahunAkademikId: academicYears[0]?.id || "", unitSekolahId: schoolUnits[0]?.id || "" })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredStudents = students.filter((s: any) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.nisn || s.nis).toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handlers Delete
  const handleDeleteConfirm = async () => {
    if (!deleteData) return
    setIsDeleting(true)
    try {
      if (deleteData.type === "tingkat") {
        await hapusTingkatan(deleteData.id)
        setGrades(grades.filter((g: any) => g.id !== deleteData.id))
      } else if (deleteData.type === "subkelas") {
        await hapusKelas(deleteData.id)
        setClassrooms(classrooms.filter((c: any) => c.id !== deleteData.id))
      } else if (deleteData.type === "murid") {
        await hapusSiswa(deleteData.id)
        setStudents(students.filter((s: any) => s.id !== deleteData.id))
      }
      setDeleteData(null)
    } catch (e: any) {
      alert("Gagal menghapus data: " + e.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handlers Edit/Save
  const handleSaveMurid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formMurid.nisn || formMurid.nisn.length !== 10) {
      alert("NISN harus 10 digit angka!")
      return
    }
    setIsSubmitting(true)
    try {
      if (formMurid.id) {
        await editSiswa(formMurid.id, { ...formMurid, nis: formMurid.nisn || `NIS-${Date.now()}` })
        setStudents(students.map((s: any) => s.id === formMurid.id ? { ...s, ...formMurid, subKelas: classrooms.find((c: any) => c.id === formMurid.subKelasId) } : s))
      } else {
        const res = await tambahSiswa({ ...formMurid, nis: formMurid.nisn || `NIS-${Date.now()}` })
        setStudents([{ ...res, subKelas: classrooms.find((c: any) => c.id === formMurid.subKelasId) }, ...students])
      }
      setShowModalMurid(false)
    } catch (err: any) { alert(err.message) }
    setIsSubmitting(false)
  }

  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formKelas.id) {
        // Edit tingkat (Not implemented yet, but keeping structure)
        alert("Fitur edit tingkat belum didukung.")
      } else {
        const res = await tambahTingkatan({ ...formKelas, order: Number(formKelas.order) })
        setGrades([...grades, { ...res, unitSekolah: schoolUnits.find((u: any) => u.id === formKelas.unitSekolahId) }].sort((a, b) => a.order - b.order))
      }
      setShowModalKelas(false)
      setFormKelas({ id: "", name: "", order: formKelas.order + 1, unitSekolahId: schoolUnits[0]?.id || "" })
    } catch (err: any) { alert(err.message) }
    setIsSubmitting(false)
  }

  const handleSaveSubKelas = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formSubKelas.id) {
        const res = await editKelas(formSubKelas.id, formSubKelas)
        setClassrooms(classrooms.map((c: any) => c.id === formSubKelas.id ? {
          ...c, ...formSubKelas, 
          tingkat: grades.find((g: any) => g.id === formSubKelas.tingkatId),
          unitSekolah: schoolUnits.find((u: any) => u.id === formSubKelas.unitSekolahId)
        } : c))
      } else {
        const res = await tambahKelas(formSubKelas)
        setClassrooms([...classrooms, { 
          ...res, 
          tingkat: grades.find((g: any) => g.id === formSubKelas.tingkatId),
          unitSekolah: schoolUnits.find((u: any) => u.id === formSubKelas.unitSekolahId),
          _count: { murid: 0 }
        }])
      }
      setShowModalSubKelas(false)
      setFormSubKelas({ id: "", name: "", tingkatId: "", jurusanId: initialMajors[0]?.id || "", tahunAkademikId: academicYears[0]?.id || "", unitSekolahId: schoolUnits[0]?.id || "" })
    } catch (err: any) { alert(err.message) }
    setIsSubmitting(false)
  }

  // UI Helpers
  const TabButton = ({ id, label }: any) => {
    const isActive = activeTab === id
    return (
      <button 
        onClick={() => setActiveTab(id)}
        style={{
          padding: "0.75rem 1.5rem", 
          borderBottom: isActive ? "2px solid var(--albas-green)" : "2px solid transparent",
          backgroundColor: "transparent",
          color: isActive ? "var(--albas-green)" : "var(--text-muted)",
          fontWeight: isActive ? 700 : 600, 
          borderTop: "none", borderLeft: "none", borderRight: "none", 
          cursor: "pointer", transition: "all 0.2s"
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteData}
        title="Konfirmasi Hapus Data"
        message="Apakah Anda yakin ingin menghapus data ini? Pastikan data ini tidak terkait dengan data transaksi keuangan lainnya."
        onCancel={() => setDeleteData(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      <div className="card" style={{ padding: "1.5rem" }}>
        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
          <TabButton id="kelas" label="Daftar Kelas (Tingkat)" />
          <TabButton id="sub-kelas" label="Daftar Sub Kelas (Rombel)" />
          <TabButton id="murid" label="Daftar Murid" />
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {(activeTab === "murid" || activeTab === "sub-kelas") && (
              <div style={{ width: "250px", position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "10px", top: "12px", color: "var(--text-muted)" }} />
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  className="form-input" 
                  style={{ paddingLeft: "35px" }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem" }} title="Fitur ekspor akan tersedia di Fase 3 / Reporting">
              <Button variant="outline" size="sm" style={{ display: "flex", gap: "0.5rem", alignItems: "center", opacity: 0.5, cursor: 'not-allowed' }} disabled>
                <FileSpreadsheet size={16}/> Excel
              </Button>
              <Button variant="outline" size="sm" style={{ display: "flex", gap: "0.5rem", alignItems: "center", opacity: 0.5, cursor: 'not-allowed' }} disabled>
                <FilePdf size={16}/> PDF
              </Button>
              {activeTab === "murid" && (
                <Button variant="outline" size="sm" style={{ display: "flex", gap: "0.5rem", alignItems: "center", opacity: 0.5, cursor: 'not-allowed' }} disabled>
                  <Upload size={16}/> Import Excel
                </Button>
              )}
            </div>
          </div>

          <div>
            {activeTab === "kelas" && (
              <Button onClick={() => {
                setFormKelas({ id: "", name: "", order: 1, unitSekolahId: schoolUnits[0]?.id || "" })
                setShowModalKelas(true)
              }}><Plus size={16} style={{ marginRight: "0.5rem" }}/> Tambah Tingkat</Button>
            )}
            {activeTab === "sub-kelas" && (
              <Button onClick={() => {
                setFormSubKelas({ id: "", name: "", tingkatId: "", jurusanId: initialMajors[0]?.id || "", tahunAkademikId: academicYears[0]?.id || "", unitSekolahId: schoolUnits[0]?.id || "" })
                setShowModalSubKelas(true)
              }}><Plus size={16} style={{ marginRight: "0.5rem" }}/> Tambah Sub Kelas</Button>
            )}
            {activeTab === "murid" && (
              <Button onClick={() => {
                setFormMurid({
                  id: "", nisn: "", name: "", unitSekolahId: schoolUnits[0]?.id || "", subKelasId: "",
                  previousSchool: "", phone: "", birthDate: "", email: "", studentStatus: "Aktif",
                  parentName: "", parentPhone: "", religion: "Islam", gender: "Laki-laki",
                  address: "", formNo: "", username: ""
                })
                setShowModalMurid(true)
              }}><Plus size={16} style={{ marginRight: "0.5rem" }}/> Tambah Murid</Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)" }}>
                <th style={{ padding: "1rem" }}>No</th>
                {activeTab === "kelas" && (
                  <>
                    <th style={{ padding: "1rem" }}>Nama Sekolah</th>
                    <th style={{ padding: "1rem" }}>Tingkat</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}>Aksi</th>
                  </>
                )}
                {activeTab === "sub-kelas" && (
                  <>
                    <th style={{ padding: "1rem" }}>Nama Sekolah</th>
                    <th style={{ padding: "1rem" }}>Tingkat</th>
                    <th style={{ padding: "1rem" }}>Sub Kelas (Rombel)</th>
                    <th style={{ padding: "1rem" }}>Jumlah Siswa</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}>Aksi</th>
                  </>
                )}
                {activeTab === "murid" && (
                  <>
                    <th style={{ padding: "1rem" }}>Sekolah</th>
                    <th style={{ padding: "1rem" }}>Asal Sekolah</th>
                    <th style={{ padding: "1rem" }}>Nama Murid</th>
                    <th style={{ padding: "1rem" }}>NISN / NIS</th>
                    <th style={{ padding: "1rem" }}>Nama Orang Tua</th>
                    <th style={{ padding: "1rem" }}>No Formulir</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}>Aksi</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {activeTab === "kelas" && grades.map((g: any, i: number) => (
                <tr key={g.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "1rem" }}>{i + 1}</td>
                  <td style={{ padding: "1rem" }}>{g.unitSekolah?.name}</td>
                  <td style={{ padding: "1rem", fontWeight: 700 }}>{g.name}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <Button variant="danger" size="sm" onClick={() => setDeleteData({ id: g.id, type: "tingkat" })}><Trash2 size={14} /></Button>
                  </td>
                </tr>
              ))}
              
              {activeTab === "sub-kelas" && classrooms.map((c: any, i: number) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "1rem" }}>{i + 1}</td>
                  <td style={{ padding: "1rem" }}>{c.unitSekolah?.name}</td>
                  <td style={{ padding: "1rem" }}>{c.tingkat?.name}</td>
                  <td style={{ padding: "1rem", fontWeight: 700 }}>{c.name}</td>
                  <td style={{ padding: "1rem" }}>{c._count?.murid || 0}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <Button variant="outline" size="sm" style={{ marginRight: "0.5rem" }} onClick={() => {
                      setFormSubKelas({
                        id: c.id, name: c.name, tingkatId: c.tingkatId, jurusanId: c.jurusanId || "", 
                        tahunAkademikId: c.tahunAkademikId, unitSekolahId: c.unitSekolahId
                      })
                      setShowModalSubKelas(true)
                    }}><Edit2 size={14} /></Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteData({ id: c.id, type: "subkelas" })}><Trash2 size={14} /></Button>
                  </td>
                </tr>
              ))}

              {activeTab === "murid" && filteredStudents.map((s: any, i: number) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "1rem" }}>{i + 1}</td>
                  <td style={{ padding: "1rem" }}>{s.unitSekolah?.name}</td>
                  <td style={{ padding: "1rem" }}>{s.previousSchool || "-"}</td>
                  <td style={{ padding: "1rem", fontWeight: 700 }}>{s.name}</td>
                  <td style={{ padding: "1rem" }}>{s.nisn || s.nis}</td>
                  <td style={{ padding: "1rem" }}>{s.parentName || "-"}</td>
                  <td style={{ padding: "1rem" }}>{s.formNo || "-"}</td>
                  <td style={{ padding: "1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                    <Button variant="outline" size="sm" onClick={() => { setFormMurid(s); setShowModalMurid(true); }} style={{ marginRight: "0.5rem" }}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteData({ id: s.id, type: "murid" })}><Trash2 size={14} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Murid */}
      {showModalMurid && (
        <div style={{ 
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, 
          display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
          backdropFilter: "blur(4px)"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "800px", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0 }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--albas-green)" }}>
                {formMurid.id ? "Edit Data Murid" : "Tambah Murid Baru"}
              </h3>
              <button onClick={() => setShowModalMurid(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>&times;</button>
            </div>
            
            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              <form id="muridForm" onSubmit={handleSaveMurid} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ gridColumn: "span 2", fontWeight: 700, color: "var(--text-main)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Data Utama Siswa</div>
                <div>
                  <label className="form-label">Nama Lengkap <span style={{color: "var(--text-error)"}}>*</span></label>
                  <Input placeholder="Nama Siswa" value={formMurid.name} onChange={e => setFormMurid({ ...formMurid, name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">NISN (10 Digit) <span style={{color: "var(--text-error)"}}>*</span></label>
                  <Input placeholder="0012345678" value={formMurid.nisn} onChange={e => setFormMurid({ ...formMurid, nisn: e.target.value })} minLength={10} maxLength={10} required />
                </div>
                <div>
                  <label className="form-label">Unit Sekolah <span style={{color: "var(--text-error)"}}>*</span></label>
                  <select className="form-input" value={formMurid.unitSekolahId} onChange={e => setFormMurid({ ...formMurid, unitSekolahId: e.target.value })} required>
                    {schoolUnits.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sub Kelas / Rombel</label>
                  <select className="form-input" value={formMurid.subKelasId} onChange={e => setFormMurid({ ...formMurid, subKelasId: e.target.value })}>
                    <option value="">-- Pilih Kelas --</option>
                    {classrooms.filter((c: any) => c.unitSekolahId === formMurid.unitSekolahId).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: "span 2", fontWeight: 700, color: "var(--text-main)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginTop: "1rem" }}>Data Pribadi & Orang Tua</div>
                <div>
                  <label className="form-label">Asal Sekolah (Opsional)</label>
                  <Input placeholder="Asal Sekolah" value={formMurid.previousSchool} onChange={e => setFormMurid({ ...formMurid, previousSchool: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Nama Orang Tua</label>
                  <Input placeholder="Nama Orang Tua" value={formMurid.parentName} onChange={e => setFormMurid({ ...formMurid, parentName: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">No. Telepon / WA Siswa</label>
                  <Input placeholder="08..." value={formMurid.phone} onChange={e => setFormMurid({ ...formMurid, phone: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">No. Telepon Orang Tua</label>
                  <Input placeholder="08..." value={formMurid.parentPhone} onChange={e => setFormMurid({ ...formMurid, parentPhone: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Agama</label>
                  <select className="form-input" value={formMurid.religion} onChange={e => setFormMurid({ ...formMurid, religion: e.target.value })}>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Jenis Kelamin</label>
                  <select className="form-input" value={formMurid.gender} onChange={e => setFormMurid({ ...formMurid, gender: e.target.value })}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Alamat Lengkap</label>
                  <textarea className="form-input" rows={3} placeholder="Masukkan alamat lengkap" value={formMurid.address} onChange={e => setFormMurid({ ...formMurid, address: e.target.value })} style={{ resize: "vertical" }} />
                </div>
                <div>
                  <label className="form-label">No. Formulir Pendaftaran</label>
                  <Input placeholder="No. Formulir" value={formMurid.formNo} onChange={e => setFormMurid({ ...formMurid, formNo: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Username (Opsional untuk Login Siswa)</label>
                  <Input placeholder="Username" value={formMurid.username} onChange={e => setFormMurid({ ...formMurid, username: e.target.value })} />
                </div>
              </form>
            </div>

            <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "1rem", backgroundColor: "white", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
              <Button type="submit" form="muridForm" isLoading={isSubmitting}>Simpan Data Murid</Button>
              <Button type="button" variant="outline" onClick={() => setShowModalMurid(false)}>Batal</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Kelas (Tingkat) */}
      {showModalKelas && (
        <div style={{ 
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, 
          display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
          backdropFilter: "blur(4px)"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", padding: 0 }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--albas-green)" }}>Tambah Tingkat Kelas</h3>
              <button onClick={() => setShowModalKelas(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>&times;</button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <form id="kelasForm" onSubmit={handleSaveKelas} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Sekolah</label>
                  <select className="form-input" value={formKelas.unitSekolahId} onChange={e => setFormKelas({ ...formKelas, unitSekolahId: e.target.value })} required>
                    {schoolUnits.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Nama Tingkat (Contoh: Kelas 7)</label>
                  <Input value={formKelas.name} onChange={e => setFormKelas({...formKelas, name: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">Tingkat / Urutan <Info size={14} style={{display:'inline', color:'var(--text-muted)'}} title="Angka yang menunjukkan jenjang kelas, misal 10 untuk Kelas X SMA"/></label>
                  <Input type="number" value={formKelas.order} onChange={e => setFormKelas({...formKelas, order: Number(e.target.value)})} required placeholder="10" />
                </div>
              </form>
            </div>
            <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "1rem", backgroundColor: "var(--bg-color)", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
              <Button type="submit" form="kelasForm" isLoading={isSubmitting}>Simpan Tingkat</Button>
              <Button type="button" variant="outline" onClick={() => setShowModalKelas(false)}>Batal</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Sub Kelas */}
      {showModalSubKelas && (
        <div style={{ 
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, 
          display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
          backdropFilter: "blur(4px)"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", padding: 0 }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--albas-green)" }}>{formSubKelas.id ? "Edit Sub Kelas" : "Tambah Sub Kelas (Rombel)"}</h3>
              <button onClick={() => setShowModalSubKelas(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>&times;</button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <form id="subKelasForm" onSubmit={handleSaveSubKelas} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Sekolah</label>
                  <select className="form-input" value={formSubKelas.unitSekolahId} onChange={e => setFormSubKelas({ ...formSubKelas, unitSekolahId: e.target.value })} required>
                    {schoolUnits.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Tingkat</label>
                  <select className="form-input" value={formSubKelas.tingkatId} onChange={e => setFormSubKelas({...formSubKelas, tingkatId: e.target.value})} required>
                    <option value="">-- Pilih Tingkat --</option>
                    {grades.filter((g: any) => g.unitSekolahId === formSubKelas.unitSekolahId).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Nama Sub Kelas (Rombel) <Info size={14} style={{display:'inline', color:'var(--text-muted)'}} title="Contoh: X-RPL 1 atau Kelas 7A"/></label>
                  <Input value={formSubKelas.name} onChange={e => setFormSubKelas({...formSubKelas, name: e.target.value})} required placeholder="Contoh: X-RPL 1" />
                </div>
                {initialMajors.length > 0 && (
                  <div>
                    <label className="form-label">Jurusan</label>
                    <select className="form-input" value={formSubKelas.jurusanId} onChange={e => setFormSubKelas({...formSubKelas, jurusanId: e.target.value})}>
                      <option value="">-- Tidak Ada / Umum --</option>
                      {initialMajors.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                )}
              </form>
            </div>
            <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "1rem", backgroundColor: "var(--bg-color)", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
              <Button type="submit" form="subKelasForm" isLoading={isSubmitting}>Simpan Sub Kelas</Button>
              <Button type="button" variant="outline" onClick={() => setShowModalSubKelas(false)}>Batal</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

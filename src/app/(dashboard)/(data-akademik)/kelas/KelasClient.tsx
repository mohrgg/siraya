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
        className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main hover:border-border"}`}
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

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <TabButton id="kelas" label="Daftar Kelas (Tingkat)" />
          <TabButton id="sub-kelas" label="Daftar Sub Kelas (Rombel)" />
          <TabButton id="murid" label="Daftar Murid" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          
          <div className="flex flex-wrap gap-4 items-center">
            {(activeTab === "murid" || activeTab === "sub-kelas") && (
              <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <div className="flex gap-2" title="Fitur ekspor akan tersedia di Fase 3 / Reporting">
              <Button variant="outline" size="sm" className="opacity-50 cursor-not-allowed" disabled>
                <FileSpreadsheet size={16} className="mr-2" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="opacity-50 cursor-not-allowed" disabled>
                <FilePdf size={16} className="mr-2" /> PDF
              </Button>
              {activeTab === "murid" && (
                <Button variant="outline" size="sm" className="opacity-50 cursor-not-allowed" disabled>
                  <Upload size={16} className="mr-2" /> Import Excel
                </Button>
              )}
            </div>
          </div>

          <div>
            {activeTab === "kelas" && (
              <Button onClick={() => {
                setFormKelas({ id: "", name: "", order: 1, unitSekolahId: schoolUnits[0]?.id || "" })
                setShowModalKelas(true)
              }}>
                <Plus size={16} className="mr-2" /> Tambah Tingkat
              </Button>
            )}
            {activeTab === "sub-kelas" && (
              <Button onClick={() => {
                setFormSubKelas({ id: "", name: "", tingkatId: "", jurusanId: initialMajors[0]?.id || "", tahunAkademikId: academicYears[0]?.id || "", unitSekolahId: schoolUnits[0]?.id || "" })
                setShowModalSubKelas(true)
              }}>
                <Plus size={16} className="mr-2" /> Tambah Sub Kelas
              </Button>
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
              }}>
                <Plus size={16} className="mr-2" /> Tambah Murid
              </Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">No</th>
                {activeTab === "kelas" && (
                  <>
                    <th className="p-4 font-semibold">Nama Sekolah</th>
                    <th className="p-4 font-semibold">Tingkat</th>
                    <th className="p-4 font-semibold text-right">Aksi</th>
                  </>
                )}
                {activeTab === "sub-kelas" && (
                  <>
                    <th className="p-4 font-semibold">Nama Sekolah</th>
                    <th className="p-4 font-semibold">Tingkat</th>
                    <th className="p-4 font-semibold">Sub Kelas (Rombel)</th>
                    <th className="p-4 font-semibold">Jumlah Siswa</th>
                    <th className="p-4 font-semibold text-right">Aksi</th>
                  </>
                )}
                {activeTab === "murid" && (
                  <>
                    <th className="p-4 font-semibold">Sekolah</th>
                    <th className="p-4 font-semibold">Asal Sekolah</th>
                    <th className="p-4 font-semibold">Nama Murid</th>
                    <th className="p-4 font-semibold">NISN / NIS</th>
                    <th className="p-4 font-semibold">Nama Orang Tua</th>
                    <th className="p-4 font-semibold">No Formulir</th>
                    <th className="p-4 font-semibold text-right">Aksi</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {activeTab === "kelas" && grades.map((g: any, i: number) => (
                <tr key={g.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">{i + 1}</td>
                  <td className="p-4 text-text-main font-medium">{g.unitSekolah?.name}</td>
                  <td className="p-4 font-bold text-text-main">{g.name}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="danger" size="sm" onClick={() => setDeleteData({ id: g.id, type: "tingkat" })}><Trash2 size={16} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {activeTab === "sub-kelas" && classrooms.map((c: any, i: number) => (
                <tr key={c.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">{i + 1}</td>
                  <td className="p-4 text-text-main font-medium">{c.unitSekolah?.name}</td>
                  <td className="p-4 text-text-main">{c.tingkat?.name}</td>
                  <td className="p-4 font-bold text-text-main">{c.name}</td>
                  <td className="p-4 text-text-muted">{c._count?.murid || 0}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setFormSubKelas({
                          id: c.id, name: c.name, tingkatId: c.tingkatId, jurusanId: c.jurusanId || "", 
                          tahunAkademikId: c.tahunAkademikId, unitSekolahId: c.unitSekolahId
                        })
                        setShowModalSubKelas(true)
                      }}><Edit2 size={16} /></Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteData({ id: c.id, type: "subkelas" })}><Trash2 size={16} /></Button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === "murid" && filteredStudents.map((s: any, i: number) => (
                <tr key={s.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">{i + 1}</td>
                  <td className="p-4 text-text-main font-medium">{s.unitSekolah?.name}</td>
                  <td className="p-4 text-text-muted">{s.previousSchool || "-"}</td>
                  <td className="p-4 font-bold text-text-main">{s.name}</td>
                  <td className="p-4 font-mono text-sm">{s.nisn || s.nis}</td>
                  <td className="p-4 text-text-muted">{s.parentName || "-"}</td>
                  <td className="p-4 text-text-muted">{s.formNo || "-"}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setFormMurid(s); setShowModalMurid(true); }}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteData({ id: s.id, type: "murid" })}><Trash2 size={16} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Murid */}
      {showModalMurid && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 md:p-8 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-surface rounded-2xl shadow-xl border border-border flex flex-col max-h-full">
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg rounded-t-2xl">
              <h3 className="text-xl font-bold text-albas-green m-0">
                {formMurid.id ? "Edit Data Murid" : "Tambah Murid Baru"}
              </h3>
              <button onClick={() => setShowModalMurid(false)} className="text-2xl text-text-muted hover:text-text-main transition-colors">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="muridForm" onSubmit={handleSaveMurid} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 font-bold text-text-main border-b border-border pb-2">Data Utama Siswa</div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Nama Lengkap <span className="text-red-500">*</span></label>
                  <Input placeholder="Nama Siswa" value={formMurid.name} onChange={e => setFormMurid({ ...formMurid, name: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">NISN (10 Digit) <span className="text-red-500">*</span></label>
                  <Input placeholder="0012345678" value={formMurid.nisn} onChange={e => setFormMurid({ ...formMurid, nisn: e.target.value })} minLength={10} maxLength={10} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Unit Sekolah <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formMurid.unitSekolahId} onChange={e => setFormMurid({ ...formMurid, unitSekolahId: e.target.value })} required>
                    {schoolUnits.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Sub Kelas / Rombel</label>
                  <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formMurid.subKelasId} onChange={e => setFormMurid({ ...formMurid, subKelasId: e.target.value })}>
                    <option value="">-- Pilih Kelas --</option>
                    {classrooms.filter((c: any) => c.unitSekolahId === formMurid.unitSekolahId).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 font-bold text-text-main border-b border-border pb-2 mt-4">Data Pribadi & Orang Tua</div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Asal Sekolah (Opsional)</label>
                  <Input placeholder="Asal Sekolah" value={formMurid.previousSchool} onChange={e => setFormMurid({ ...formMurid, previousSchool: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Nama Orang Tua</label>
                  <Input placeholder="Nama Orang Tua" value={formMurid.parentName} onChange={e => setFormMurid({ ...formMurid, parentName: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">No. Telepon / WA Siswa</label>
                  <Input placeholder="08..." value={formMurid.phone} onChange={e => setFormMurid({ ...formMurid, phone: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">No. Telepon Orang Tua</label>
                  <Input placeholder="08..." value={formMurid.parentPhone} onChange={e => setFormMurid({ ...formMurid, parentPhone: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Agama</label>
                  <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formMurid.religion} onChange={e => setFormMurid({ ...formMurid, religion: e.target.value })}>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Jenis Kelamin</label>
                  <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formMurid.gender} onChange={e => setFormMurid({ ...formMurid, gender: e.target.value })}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Alamat Lengkap</label>
                  <textarea className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium resize-y" rows={3} placeholder="Masukkan alamat lengkap" value={formMurid.address} onChange={e => setFormMurid({ ...formMurid, address: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">No. Formulir Pendaftaran</label>
                  <Input placeholder="No. Formulir" value={formMurid.formNo} onChange={e => setFormMurid({ ...formMurid, formNo: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Username (Opsional untuk Login Siswa)</label>
                  <Input placeholder="Username" value={formMurid.username} onChange={e => setFormMurid({ ...formMurid, username: e.target.value })} />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-border flex gap-4 bg-bg rounded-b-2xl shrink-0">
              <Button type="submit" form="muridForm" isLoading={isSubmitting}>Simpan Data Murid</Button>
              <Button type="button" variant="outline" onClick={() => setShowModalMurid(false)}>Batal</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Kelas (Tingkat) */}
      {showModalKelas && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-border flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg rounded-t-2xl">
              <h3 className="text-xl font-bold text-albas-green m-0">Tambah Tingkat Kelas</h3>
              <button onClick={() => setShowModalKelas(false)} className="text-2xl text-text-muted hover:text-text-main transition-colors">&times;</button>
            </div>
            <div className="p-6">
              <form id="kelasForm" onSubmit={handleSaveKelas} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Sekolah</label>
                  <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formKelas.unitSekolahId} onChange={e => setFormKelas({ ...formKelas, unitSekolahId: e.target.value })} required>
                    {schoolUnits.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Nama Tingkat (Contoh: Kelas 7)</label>
                  <Input value={formKelas.name} onChange={e => setFormKelas({...formKelas, name: e.target.value})} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">Tingkat / Urutan <Info size={14} className="text-text-muted" title="Angka yang menunjukkan jenjang kelas, misal 10 untuk Kelas X SMA"/></label>
                  <Input type="number" value={formKelas.order} onChange={e => setFormKelas({...formKelas, order: Number(e.target.value)})} required placeholder="10" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-border flex gap-4 bg-bg rounded-b-2xl">
              <Button type="submit" form="kelasForm" isLoading={isSubmitting}>Simpan Tingkat</Button>
              <Button type="button" variant="outline" onClick={() => setShowModalKelas(false)}>Batal</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Sub Kelas */}
      {showModalSubKelas && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-border flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg rounded-t-2xl">
              <h3 className="text-xl font-bold text-albas-green m-0">{formSubKelas.id ? "Edit Sub Kelas" : "Tambah Sub Kelas (Rombel)"}</h3>
              <button onClick={() => setShowModalSubKelas(false)} className="text-2xl text-text-muted hover:text-text-main transition-colors">&times;</button>
            </div>
            <div className="p-6">
              <form id="subKelasForm" onSubmit={handleSaveSubKelas} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Sekolah</label>
                  <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formSubKelas.unitSekolahId} onChange={e => setFormSubKelas({ ...formSubKelas, unitSekolahId: e.target.value })} required>
                    {schoolUnits.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Tingkat</label>
                  <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formSubKelas.tingkatId} onChange={e => setFormSubKelas({...formSubKelas, tingkatId: e.target.value})} required>
                    <option value="">-- Pilih Tingkat --</option>
                    {grades.filter((g: any) => g.unitSekolahId === formSubKelas.unitSekolahId).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">Nama Sub Kelas (Rombel) <Info size={14} className="text-text-muted" title="Contoh: X-RPL 1 atau Kelas 7A"/></label>
                  <Input value={formSubKelas.name} onChange={e => setFormSubKelas({...formSubKelas, name: e.target.value})} required placeholder="Contoh: X-RPL 1" />
                </div>
                {initialMajors.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main">Jurusan</label>
                    <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formSubKelas.jurusanId} onChange={e => setFormSubKelas({...formSubKelas, jurusanId: e.target.value})}>
                      <option value="">-- Tidak Ada / Umum --</option>
                      {initialMajors.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                )}
              </form>
            </div>
            <div className="p-6 border-t border-border flex gap-4 bg-bg rounded-b-2xl">
              <Button type="submit" form="subKelasForm" isLoading={isSubmitting}>Simpan Sub Kelas</Button>
              <Button type="button" variant="outline" onClick={() => setShowModalSubKelas(false)}>Batal</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

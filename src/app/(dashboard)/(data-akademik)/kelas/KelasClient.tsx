"use client"

import { useState, useEffect } from "react"
import { Search, FileSpreadsheet, FileIcon as FilePdf, Plus, Upload, Trash2, Edit2, Info, User } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { tambahKelas, tambahTingkatan, editKelas, hapusKelas, hapusTingkatan } from "@/actions/kelas"
import { tambahSiswa, editSiswa, hapusSiswa, getSiswaPaginated } from "@/actions/siswa"
import ImportMuridModal from "@/components/modals/ImportMuridModal"
import MuridFormModal from "@/components/modals/MuridFormModal"

export default function KelasClient({ 
  activeUnitId, activeYearId, initialGrades, initialMajors, initialClassrooms, initialStudents, academicYears, schoolUnits 
}: { 
  activeUnitId?: string, activeYearId?: string, initialGrades: any[], initialMajors: any[], initialClassrooms: any[], initialStudents: any[], academicYears: any[], schoolUnits: any[] 
}) {
  const [activeTab, setActiveTab] = useState<"kelas" | "sub-kelas" | "murid" | "alumni">("kelas")

  // States
  const [grades, setGrades] = useState(initialGrades)
  const [classrooms, setClassrooms] = useState(initialClassrooms)
  const [students, setStudents] = useState(initialStudents)

  const [pageSize, setPageSize] = useState(10)
  const [fullscreenPhotoUrl, setFullscreenPhotoUrl] = useState<string | null>(null)

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
  const [showModalImportMurid, setShowModalImportMurid] = useState(false)  
  const [viewDetailMurid, setViewDetailMurid] = useState<any>(null)
  const [viewDetailSubKelas, setViewDetailSubKelas] = useState<any>(null)
  
  // Confirm Delete Modal
  const [deleteData, setDeleteData] = useState<{ id: string, type: "tingkat" | "subkelas" | "murid" } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Forms
  const [formMurid, setFormMurid] = useState<any>({
    id: "", nisn: "", name: "", unitSekolahId: schoolUnits[0]?.id || "", subKelasId: "",
    previousSchool: "", phone: "", birthDate: "", email: "", studentStatus: "AKTIF",
    parentName: "", parentPhone: "", religion: "Islam", gender: "Laki-laki",
    address: "", formNo: "", username: ""
  })
  const [formKelas, setFormKelas] = useState({ id: "", name: "", order: 1, unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
  const [formSubKelas, setFormSubKelas] = useState({ id: "", name: "", tingkatId: "", jurusanId: "", tahunAkademikId: activeYearId || academicYears[0]?.id || "", unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterJurusanId, setFilterJurusanId] = useState("")
  
  const [filterMuridTingkat, setFilterMuridTingkat] = useState("")
  const [filterMuridJurusan, setFilterMuridJurusan] = useState("")
  const [filterMuridSubKelas, setFilterMuridSubKelas] = useState("")
  const [filterAlumniStatus, setFilterAlumniStatus] = useState("NON_AKTIF")

  // Client-side Sorting for Kelas & Sub Kelas
  const filteredGrades = grades.filter((g: any) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return g.name?.toLowerCase().includes(term) || g.unitSekolah?.name?.toLowerCase().includes(term)
  })
  const { items: sortedGrades, requestSort: requestSortGrades, sortConfig: sortGrades } = useSortableData(filteredGrades);
  const filteredClassrooms = classrooms.filter((c: any) => {
    const matchJurusan = filterJurusanId ? c.jurusanId === filterJurusanId : true
    if (!searchTerm) return matchJurusan
    const term = searchTerm.toLowerCase()
    return matchJurusan && (c.name?.toLowerCase().includes(term) || c.tingkat?.name?.toLowerCase().includes(term) || c.unitSekolah?.name?.toLowerCase().includes(term))
  });
  const { items: sortedClassrooms, requestSort: requestSortClassrooms, sortConfig: sortClassrooms } = useSortableData(filteredClassrooms);

  // Pagination & Server-side Sorting for Murid
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Local Pagination for Kelas & Sub Kelas
  const paginatedGrades = sortedGrades.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const paginatedClassrooms = sortedClassrooms.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  
  const computedTotalPages = (activeTab === "murid" || activeTab === "alumni") 
    ? totalPages 
    : activeTab === "kelas"
      ? Math.ceil(sortedGrades.length / pageSize) || 1
      : Math.ceil(sortedClassrooms.length / pageSize) || 1


  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [muridSort, setMuridSort] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'name', direction: 'asc' })

  const handleMuridSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (muridSort.key === key && muridSort.direction === 'asc') direction = 'desc';
    else if (muridSort.key === key && muridSort.direction === 'desc') direction = null;
    setMuridSort({ key, direction });
  }

  // Fetch Students Paginated
  useEffect(() => {
    if (activeTab !== "murid" && activeTab !== "alumni") return;
    
    const fetchStudents = async () => {
      setIsLoadingStudents(true)
      try {
        const res = await getSiswaPaginated({
          unitSekolahId: activeUnitId || schoolUnits[0]?.id || "",
          tingkatId: filterMuridTingkat,
          jurusanId: filterMuridJurusan,
          subKelasId: filterMuridSubKelas,
          search: searchTerm,
          page: currentPage,
          limit: pageSize,
          sortBy: muridSort.direction ? muridSort.key : undefined,
          sortOrder: muridSort.direction || undefined,
          statusFilter: activeTab === "murid" ? "AKTIF" : filterAlumniStatus
        })
        setStudents(res.data)
        setTotalPages(res.totalPages)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoadingStudents(false)
      }
    }
    
    const timeout = setTimeout(fetchStudents, 300)
    return () => clearTimeout(timeout)
  }, [activeUnitId, searchTerm, filterMuridTingkat, filterMuridJurusan, filterMuridSubKelas, filterAlumniStatus, currentPage, pageSize, schoolUnits, activeTab, muridSort])

  // Reset page on search or unit change or filters
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterMuridTingkat, filterMuridJurusan, filterMuridSubKelas, activeUnitId, filterAlumniStatus, activeTab])

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

  const getStatusBadge = (status?: string) => {
    const s = status?.toUpperCase() || "AKTIF";
    if (s === "AKTIF") return "bg-emerald-100 text-emerald-700";
    if (s === "LULUS") return "bg-blue-100 text-blue-700";
    if (s === "PINDAH") return "bg-orange-100 text-orange-700";
    if (s === "CUTI") return "bg-yellow-100 text-yellow-800";
    return "bg-rose-100 text-rose-700"; // KELUAR / DO
  }

  // Handlers Edit/Save
  const handleSaveMurid = async (formData: any) => {
    if (!formData.nisn || formData.nisn.length !== 10) {
      alert("NISN harus 10 digit angka!")
      return
    }
    setIsSubmitting(true)
    try {
      if (formData.id) {
        await editSiswa(formData.id, { ...formData, nis: formData.nisn || `NIS-${Date.now()}` })
        setStudents(students.map((s: any) => s.id === formData.id ? { ...s, ...formData, riwayatKelas: [{ subKelasId: formData.subKelasId, subKelas: classrooms.find((c: any) => c.id === formData.subKelasId) }] } : s))
      } else {
        const res = await tambahSiswa({ ...formData, nis: formData.nisn || `NIS-${Date.now()}` })
        setStudents([{ ...res, riwayatKelas: [{ subKelasId: formData.subKelasId, subKelas: classrooms.find((c: any) => c.id === formData.subKelasId) }] }, ...students])
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
      // Handle empty options nicely
      setFormKelas({ id: "", name: "", order: formKelas.order + 1, unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
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
      setFormSubKelas({ id: "", name: "", tingkatId: "", jurusanId: "", tahunAkademikId: activeYearId || academicYears[0]?.id || "", unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
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
          <TabButton id="murid" label="Murid Aktif" />
          <TabButton id="alumni" label="Riwayat & Alumni" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
          
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div className="relative w-full md:w-64 flex-shrink-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Cari..." 
                className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {activeTab === "sub-kelas" && initialMajors.length > 0 && (
              <select 
                className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                value={filterJurusanId}
                onChange={(e) => setFilterJurusanId(e.target.value)}
              >
                <option value="">Semua Jurusan</option>
                {initialMajors.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
            
            {(activeTab === "murid" || activeTab === "alumni") && (
              <>
                <select 
                  className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                  value={filterMuridTingkat}
                  onChange={(e) => { setFilterMuridTingkat(e.target.value); setFilterMuridSubKelas("") }}
                >
                  <option value="">Semua Tingkat</option>
                  {grades.filter((g: any) => g.unitSekolahId === (activeUnitId || schoolUnits[0]?.id)).map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                
                {initialMajors.filter((m: any) => m.unitSekolahId === activeUnitId).length > 0 && (
                  <select 
                    className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                    value={filterMuridJurusan}
                    onChange={(e) => { setFilterMuridJurusan(e.target.value); setFilterMuridSubKelas("") }}
                  >
                    <option value="">Semua Jurusan</option>
                    {initialMajors.filter((m: any) => m.unitSekolahId === activeUnitId).map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
                
                <select 
                  className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium max-w-[150px] truncate"
                  value={filterMuridSubKelas}
                  onChange={(e) => setFilterMuridSubKelas(e.target.value)}
                >
                  <option value="">Semua Rombel</option>
                  {classrooms.filter((c: any) => c.unitSekolahId === (activeUnitId || schoolUnits[0]?.id) && (!filterMuridTingkat || c.tingkatId === filterMuridTingkat) && (!filterMuridJurusan || c.jurusanId === filterMuridJurusan)).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {activeTab === "alumni" && (
                  <select 
                    className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                    value={filterAlumniStatus}
                    onChange={(e) => setFilterAlumniStatus(e.target.value)}
                  >
                    <option value="SEMUA">Semua Status</option>
                    <option value="NON_AKTIF">Semua (Non-Aktif)</option>
                    <option value="LULUS">Lulus</option>
                    <option value="PINDAH">Pindah</option>
                    <option value="CUTI">Cuti</option>
                    <option value="KELUAR">Keluar (DO)</option>
                  </select>
                )}

                {(searchTerm || filterMuridTingkat || filterMuridJurusan || filterMuridSubKelas || (activeTab === 'alumni' && filterAlumniStatus !== "NON_AKTIF")) && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearchTerm("")
                    setFilterMuridTingkat("")
                    setFilterMuridJurusan("")
                    setFilterMuridSubKelas("")
                    if (activeTab === 'alumni') setFilterAlumniStatus("NON_AKTIF")
                  }}>
                    Reset Filter
                  </Button>
                )}
              </>
            )}

            <div className="flex gap-2 border-l border-border pl-3" title="Fitur ekspor akan tersedia di Fase 3 / Reporting">
              <Button variant="outline" size="sm" className="opacity-50 cursor-not-allowed" disabled>
                <FileSpreadsheet size={16} className="mr-1.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="opacity-50 cursor-not-allowed" disabled>
                <FilePdf size={16} className="mr-1.5" /> PDF
              </Button>
              {activeTab === "murid" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800"
                  onClick={() => setShowModalImportMurid(true)}
                >
                  <Upload size={16} className="mr-1.5" /> Impor Excel
                </Button>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            {activeTab === "kelas" && (
              <Button onClick={() => {
                setFormKelas({ id: "", name: "", order: 1, unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
                setShowModalKelas(true)
              }}><Plus size={16} className="mr-1.5" /> Tambah Tingkat</Button>
            )}
            {activeTab === "sub-kelas" && (
              <Button onClick={() => {
                setFormSubKelas({ id: "", name: "", tingkatId: "", jurusanId: "", tahunAkademikId: activeYearId || academicYears[0]?.id || "", unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
                setShowModalSubKelas(true)
              }}>
                <Plus size={16} className="mr-2" /> Tambah Sub Kelas
              </Button>
            )}
            {activeTab === "murid" && (
              <Button onClick={() => {
                setFormMurid({
                  id: "", nisn: "", name: "", unitSekolahId: activeUnitId || schoolUnits[0]?.id || "", subKelasId: "",
                  previousSchool: "", phone: "", birthDate: "", email: "", studentStatus: "AKTIF",
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
              <tr className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
                <th className="p-4 font-semibold">No</th>
                {activeTab === "kelas" && (
                  <>
                    <SortableHeader label="Nama Sekolah" sortKey="unitSekolah.name" currentSortKey={sortGrades?.key as string} currentDirection={sortGrades?.direction} onSort={requestSortGrades as any} />
                    <SortableHeader label="Tingkat" sortKey="name" currentSortKey={sortGrades?.key as string} currentDirection={sortGrades?.direction} onSort={requestSortGrades as any} />
                    <th className="p-4 font-semibold text-right">Aksi</th>
                  </>
                )}
                {activeTab === "sub-kelas" && (
                  <>
                    <SortableHeader label="Nama Sekolah" sortKey="unitSekolah.name" currentSortKey={sortClassrooms?.key as string} currentDirection={sortClassrooms?.direction} onSort={requestSortClassrooms as any} />
                    <SortableHeader label="Tingkat" sortKey="tingkat.name" currentSortKey={sortClassrooms?.key as string} currentDirection={sortClassrooms?.direction} onSort={requestSortClassrooms as any} />
                    <SortableHeader label="Sub Kelas (Rombel)" sortKey="name" currentSortKey={sortClassrooms?.key as string} currentDirection={sortClassrooms?.direction} onSort={requestSortClassrooms as any} />
                    <th className="p-4 font-semibold">Jumlah Siswa</th>
                    <th className="p-4 font-semibold text-right">Aksi</th>
                  </>
                )}
                {(activeTab === "murid" || activeTab === "alumni") && (
                  <>
                    <SortableHeader label="Nama Murid" sortKey="name" currentSortKey={muridSort.key} currentDirection={muridSort.direction} onSort={handleMuridSort} />
                    <SortableHeader label="NISN / NIS" sortKey="nisn" currentSortKey={muridSort.key} currentDirection={muridSort.direction} onSort={handleMuridSort} />
                    <th className="p-4 font-semibold text-left">Jenis Kelamin</th>
                    <th className="p-4 font-semibold text-left">Kelas / Rombel</th>
                    <SortableHeader label="Status" sortKey="status" currentSortKey={muridSort.key} currentDirection={muridSort.direction} onSort={handleMuridSort} />
                    <th className="p-4 font-semibold text-right">Aksi</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {activeTab === "kelas" && paginatedGrades.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">Belum ada data tingkat kelas.</td></tr>
              )}
              {activeTab === "kelas" && paginatedGrades.map((g: any, i: number) => (
                <tr key={g.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="p-4 text-text-main font-medium">{g.unitSekolah?.name}</td>
                  <td className="p-4 font-bold text-text-main">{g.name}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="danger" size="sm" onClick={() => setDeleteData({ id: g.id, type: "tingkat" })}><Trash2 size={16} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {activeTab === "sub-kelas" && paginatedClassrooms.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Belum ada data rombel.</td></tr>
              )}
              {activeTab === "sub-kelas" && paginatedClassrooms.map((c: any, i: number) => (
                <tr key={c.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="p-4 text-text-main font-medium">{c.unitSekolah?.name}</td>
                  <td className="p-4 text-text-main">{c.tingkat?.name}</td>
                  <td className="p-4 font-bold text-text-main">{c.name}</td>
                  <td className="p-4 text-text-muted">{c._count?.riwayatKelas || 0}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewDetailSubKelas(c)}><Info size={16} /></Button>
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

              {((activeTab === "murid" || activeTab === "alumni") && !isLoadingStudents && students.length === 0) && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-text-muted">
                    {searchTerm ? "Tidak ada siswa yang cocok dengan pencarian" : "Belum ada data siswa"}
                  </td>
                </tr>
              )}
              {((activeTab === "murid" || activeTab === "alumni") && isLoadingStudents) && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-text-muted">
                    Memuat data siswa...
                  </td>
                </tr>
              )}
              {((activeTab === "murid" || activeTab === "alumni") && !isLoadingStudents) && students.map((s: any, i: number) => (
                <tr key={s.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 border border-border overflow-hidden flex items-center justify-center">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-text-main">{s.name}</div>
                        <div className="text-xs text-text-muted mt-0.5">{s.unitSekolah?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-mono text-sm text-text-main font-semibold">{s.nisn || "-"}</div>
                    <div className="text-xs text-text-muted mt-0.5">{s.nis}</div>
                  </td>
                  <td className="p-4 text-text-main">{s.gender}</td>
                  <td className="p-4 font-medium text-text-main">
                    {s.riwayatKelas?.[0]?.subKelas?.name ? (
                      <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-sm font-semibold">{s.riwayatKelas[0].subKelas.name}</span>
                    ) : (
                      <span className="text-xs italic text-text-muted">Belum ada kelas</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusBadge(s.status)}`}>
                      {s.status?.toUpperCase() || "AKTIF"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewDetailMurid(s)}><Info size={16} /></Button>
                      <Button variant="outline" size="sm" onClick={() => { 
                        setFormMurid({ ...s, subKelasId: s.riwayatKelas?.[0]?.subKelasId || "" }); 
                        setShowModalMurid(true); 
                      }}>
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

        {/* Pagination Controls */}
        {computedTotalPages > 0 && (
          <div className="p-4 mt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface rounded-b-2xl">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-muted">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-bg border border-border rounded-lg text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium"
              >
                <option value={10}>10 Baris</option>
                <option value={20}>20 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-text-muted">Halaman {currentPage} dari {computedTotalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoadingStudents}>Sebelumnya</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(computedTotalPages, p + 1))} disabled={currentPage === computedTotalPages || isLoadingStudents}>Selanjutnya</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Murid (Moved to Separate Component) */}
      <MuridFormModal 
        isOpen={showModalMurid}
        onClose={() => setShowModalMurid(false)}
        onSave={handleSaveMurid}
        initialData={formMurid}
        schoolUnits={schoolUnits}
        classrooms={classrooms}
      />

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
                <div className="hidden">
                  <label className="text-sm font-semibold text-text-main">Sekolah</label>
                  <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formKelas.unitSekolahId} onChange={e => setFormKelas({ ...formKelas, unitSekolahId: e.target.value })} required>
                    {schoolUnits.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Tingkat Kelas</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium"
                    value={formKelas.order}
                    onChange={e => {
                      const order = Number(e.target.value)
                      let name = `Kelas ${order}`
                      if (order === 10) name = "Kelas X"
                      else if (order === 11) name = "Kelas XI"
                      else if (order === 12) name = "Kelas XII"
                      else if (order === 7) name = "Kelas VII"
                      else if (order === 8) name = "Kelas VIII"
                      else if (order === 9) name = "Kelas IX"
                      setFormKelas({...formKelas, order, name})
                    }}
                    required
                  >
                    <option value="">-- Pilih Tingkat --</option>
                    {(() => {
                      const activeUnit = schoolUnits.find((u: any) => u.id === formKelas.unitSekolahId)
                      const level = activeUnit?.level?.toUpperCase() || ""
                      let options: number[] = []
                      if (level.includes("SD") || level.includes("MI")) options = [1, 2, 3, 4, 5, 6]
                      else if (level.includes("SMP") || level.includes("MTS")) options = [7, 8, 9]
                      else if (level.includes("SMK") || level.includes("SMA") || level.includes("MA")) options = [10, 11, 12]
                      
                      return options.map(opt => <option key={opt} value={opt}>Kelas {opt}</option>)
                    })()}
                  </select>
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
                <div className="hidden">
                  <label className="text-sm font-semibold text-text-main">Sekolah</label>
                  <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formSubKelas.unitSekolahId} onChange={e => setFormSubKelas({ ...formSubKelas, unitSekolahId: e.target.value, jurusanId: "" })} required>
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
                  <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">Nama Sub Kelas (Rombel) <Info size={14} className="text-text-muted" /></label>
                  <Input value={formSubKelas.name} onChange={e => setFormSubKelas({...formSubKelas, name: e.target.value})} required placeholder="Contoh: X-RPL 1" />
                </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main flex justify-between">
                      Jurusan / Program <span className="text-red-500">*</span>
                    </label>
                    {initialMajors.filter((m: any) => m.unitSekolahId === formSubKelas.unitSekolahId).length === 0 ? (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                        Belum ada Jurusan untuk unit sekolah ini. Harap tambahkan jurusan (misal: "Umum") di menu Program & Jurusan terlebih dahulu.
                      </div>
                    ) : (
                      <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formSubKelas.jurusanId} onChange={e => setFormSubKelas({...formSubKelas, jurusanId: e.target.value})} required>
                        <option value="">-- Pilih Jurusan --</option>
                        {initialMajors.filter((m: any) => m.unitSekolahId === formSubKelas.unitSekolahId).map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    )}
                  </div>
              </form>
            </div>
            <div className="p-6 border-t border-border flex gap-4 bg-bg rounded-b-2xl">
              <Button type="submit" form="subKelasForm" isLoading={isSubmitting} disabled={initialMajors.filter((m: any) => m.unitSekolahId === formSubKelas.unitSekolahId).length === 0}>Simpan Sub Kelas</Button>
              <Button type="button" variant="outline" onClick={() => setShowModalSubKelas(false)}>Batal</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Sub Kelas */}
      {viewDetailSubKelas && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-border flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg rounded-t-2xl">
              <h3 className="text-xl font-bold text-albas-green m-0">Detail Rombel</h3>
              <button onClick={() => setViewDetailSubKelas(null)} className="text-2xl text-text-muted hover:text-text-main transition-colors">&times;</button>
            </div>
            <div className="p-6 flex flex-col gap-4 text-text-main">
              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="text-text-muted font-medium">Nama Rombel</span>
                <span className="col-span-2 font-bold">{viewDetailSubKelas.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="text-text-muted font-medium">Unit Sekolah</span>
                <span className="col-span-2">{viewDetailSubKelas.unitSekolah?.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="text-text-muted font-medium">Tingkat</span>
                <span className="col-span-2">{viewDetailSubKelas.tingkat?.name}</span>
              </div>
              {viewDetailSubKelas.jurusan && (
                <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                  <span className="text-text-muted font-medium">Jurusan</span>
                  <span className="col-span-2">{viewDetailSubKelas.jurusan.name}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                <span className="text-text-muted font-medium">Jumlah Siswa</span>
                <span className="col-span-2">{viewDetailSubKelas._count?.riwayatKelas || 0} Siswa Aktif</span>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3 bg-bg rounded-b-2xl">
              <Button type="button" variant="outline" onClick={() => setViewDetailSubKelas(null)}>Tutup</Button>
              <Button type="button" variant="primary" onClick={() => {
                setActiveTab("murid");
                setFilterMuridTingkat(viewDetailSubKelas.tingkatId || "");
                setFilterMuridJurusan(viewDetailSubKelas.jurusanId || "");
                setFilterMuridSubKelas(viewDetailSubKelas.id);
                setViewDetailSubKelas(null);
              }}>Lihat Daftar Siswa</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Murid */}
      {viewDetailMurid && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-xl border border-border flex flex-col max-h-full">
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg rounded-t-2xl">
              <h3 className="text-xl font-bold text-albas-green m-0">Detail Murid</h3>
              <button onClick={() => setViewDetailMurid(null)} className="text-2xl text-text-muted hover:text-text-main transition-colors">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex flex-col gap-6 text-text-main">
                
                {/* Header Profil */}
                <div className="flex items-center gap-4 border-b border-border pb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl uppercase overflow-hidden border-2 border-primary/20 shrink-0">
                    {viewDetailMurid.photoUrl ? (
                      <img 
                        src={viewDetailMurid.photoUrl} 
                        alt={viewDetailMurid.name} 
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => setFullscreenPhotoUrl(viewDetailMurid.photoUrl)}
                      />
                    ) : (
                      viewDetailMurid.name.substring(0, 2)
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{viewDetailMurid.name}</h2>
                    <p className="text-text-muted">{viewDetailMurid.nisn || viewDetailMurid.nis}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Unit Sekolah</span>
                    <span className="font-medium">{viewDetailMurid.unitSekolah?.name || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Kelas / Rombel</span>
                    <span className="font-medium">{viewDetailMurid.riwayatKelas?.[0]?.subKelas?.name || "Belum masuk kelas"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Status Siswa</span>
                    <span className="font-medium">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(viewDetailMurid.status)}`}>
                        {viewDetailMurid.status?.toUpperCase() || "AKTIF"}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Jalur Beasiswa</span>
                    <span className="font-medium">{viewDetailMurid.isScholarship ? "Ya (Penerima Beasiswa)" : "Tidak"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tempat, Tanggal Lahir</span>
                    <span className="font-medium">
                      {viewDetailMurid.birthPlace || "-"}, {viewDetailMurid.birthDate ? new Date(viewDetailMurid.birthDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">NIK</span>
                    <span className="font-medium">{viewDetailMurid.nik || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Jenis Kelamin</span>
                    <span className="font-medium">{viewDetailMurid.gender || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Agama</span>
                    <span className="font-medium">{viewDetailMurid.religion || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">No. Telepon Siswa</span>
                    <span className="font-medium">{viewDetailMurid.phone || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Anak Ke / Bersaudara</span>
                    <span className="font-medium">{viewDetailMurid.childOrder || "?"} dari {viewDetailMurid.siblingCount || "?"}</span>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-border">
                    <h4 className="font-bold text-text-main mb-4">Informasi Orang Tua / Wali</h4>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Nama Ayah</span>
                    <span className="font-medium">{viewDetailMurid.fatherName || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Nama Ibu</span>
                    <span className="font-medium">{viewDetailMurid.motherName || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">No. Telepon Orang Tua</span>
                    <span className="font-medium">{viewDetailMurid.parentPhone || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Golongan Darah</span>
                    <span className="font-medium">{viewDetailMurid.bloodType || "-"}</span>
                  </div>
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Alamat Lengkap</span>
                    <span className="font-medium">
                      {viewDetailMurid.address || "-"}
                      {viewDetailMurid.rt || viewDetailMurid.rw ? `, RT ${viewDetailMurid.rt || '-'} / RW ${viewDetailMurid.rw || '-'}` : ""}
                      {viewDetailMurid.village ? `, Kel. ${viewDetailMurid.village}` : ""}
                      {viewDetailMurid.district ? `, Kec. ${viewDetailMurid.district}` : ""}
                    </span>
                  </div>
                </div>

              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end bg-bg rounded-b-2xl shrink-0">
              <Button type="button" onClick={() => setViewDetailMurid(null)}>Tutup</Button>
            </div>
          </div>
        </div>
      )}

      <ImportMuridModal 
        isOpen={showModalImportMurid}
        onClose={() => setShowModalImportMurid(false)}
        onSuccess={() => {
          setShowModalImportMurid(false)
          // We can force a refresh by reloading or calling a router.refresh() 
          window.location.reload()
        }}
        schoolUnits={schoolUnits}
        classrooms={classrooms}
      />

      {/* Fullscreen Photo Overlay */}
      {fullscreenPhotoUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center p-4 backdrop-blur-md cursor-pointer animate-in fade-in duration-200"
          onClick={() => setFullscreenPhotoUrl(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors text-4xl"
            onClick={(e) => { e.stopPropagation(); setFullscreenPhotoUrl(null); }}
          >
            &times;
          </button>
          <img 
            src={fullscreenPhotoUrl} 
            alt="Fullscreen Photo" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl pointer-events-none" 
          />
        </div>
      )}
    </div>
  )
}

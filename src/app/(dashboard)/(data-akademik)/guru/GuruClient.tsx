"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { 
  Edit2, 
  Plus, 
  Trash2, 
  GraduationCap, 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Phone, 
  MessageCircle,
  Building2,
  BadgeCheck,
  UploadCloud,
  User,
  X,
  Eye,
  Filter,
  Mail,
  BookOpen
} from "lucide-react"
import Link from "next/link"
import { tambahGuru, editGuru, hapusGuru, hapusGuruMassal } from "@/actions/guru"
import toast from "react-hot-toast"
import GuruFormModal from "@/components/modals/GuruFormModal"
import ImportGuruModal from "@/components/modals/ImportGuruModal"
import { 
  Toolbar, 
  ToolbarSearch, 
  ToolbarFilter, 
  ToolbarActions, 
  ToolbarExportExcel, 
  ToolbarExportPDF, 
  ToolbarImportExcel, 
  ToolbarAddButton, 
  ToolbarDivider 
} from "@/components/ui/DataTableToolbar"

type Guru = {
  id: string
  nip: string | null
  name: string
  gender: string
  phone: string | null
  email: string | null
  statusKepegawaian: string
  pendidikan: string | null
  bidangStudiId: string | null
  bidangStudi?: { id: string; name: string } | null
  bankName: string | null
  bankAccount: string | null
  bankAccountName: string | null
  isActive: boolean
  unitSekolahId: string
  unitSekolah?: { id: string, name: string, level?: string }
  rombelWali?: { id: string; name: string }[] | null
}

type UnitSekolah = {
  id: string
  name: string
  level?: string
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  namaKepalaSekolah?: string | null
}

export default function GuruClient({
  initialData,
  schoolUnits,
  userRole,
  activeUnitId,
  pengaturan,
  userName
}: {
  initialData: Guru[]
  schoolUnits: UnitSekolah[]
  userRole?: string
  activeUnitId: string
  pengaturan?: any
  userName?: string
}) {
  const router = useRouter()
  const isReadOnly = userRole === "KEPALA_SEKOLAH"

  const [data, setData] = useState<Guru[]>(initialData)
  
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const [statusFilter, setStatusFilter] = useState<string>("")
  const [unitFilter, setUnitFilter] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeUnitId, statusFilter, searchTerm, unitFilter])

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showModalImportGuru, setShowModalImportGuru] = useState(false)

  const [selectedGurus, setSelectedGurus] = useState<string[]>([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)

  const defaultForm = {
    id: "",
    name: "",
    nip: "",
    gender: "Laki-laki",
    phone: "",
    email: "",
    statusKepegawaian: "-",
    pendidikan: "S1",
    bidangStudiId: "",
    bankName: "",
    bankAccount: "",
    bankAccountName: "",
    unitSekolahId: schoolUnits[0]?.id || "",
    isActive: true
  }

  const [formData, setFormData] = useState(defaultForm)

  const executiveMetrics = useMemo(() => {
    const totalGuru = data.length
    const totalTetap = data.filter(g => g.statusKepegawaian === "GTY" || g.statusKepegawaian === "TETAP" || g.statusKepegawaian === "PNS").length
    const totalHonorer = totalGuru - totalTetap
    const pctTetap = totalGuru > 0 ? Math.round((totalTetap / totalGuru) * 100) : 0
    const totalWali = data.filter(g => g.rombelWali && g.rombelWali.length > 0).length
    const totalS1Plus = data.filter(g => g.pendidikan && (g.pendidikan.includes("S1") || g.pendidikan.includes("S2") || g.pendidikan.includes("S3"))).length
    const pctS1Plus = totalGuru > 0 ? Math.round((totalS1Plus / totalGuru) * 100) : 0

    return {
      totalGuru,
      totalTetap,
      totalHonorer,
      pctTetap,
      totalWali,
      totalS1Plus,
      pctS1Plus
    }
  }, [data])

  const handleOpenAdd = () => {
    setFormData({
      ...defaultForm,
      unitSekolahId: (activeUnitId && activeUnitId !== "all") ? activeUnitId : (schoolUnits[0]?.id || "")
    })
    setIsAdding(true)
  }

  const handleEdit = (item: Guru) => {
    setFormData({
      id: item.id,
      name: item.name,
      nip: item.nip || "",
      gender: item.gender || "Laki-laki",
      phone: item.phone || "",
      email: item.email || "",
      statusKepegawaian: item.statusKepegawaian || "-",
      pendidikan: item.pendidikan || "S1",
      bidangStudiId: item.bidangStudiId || "",
      bankName: item.bankName || "",
      bankAccount: item.bankAccount || "",
      bankAccountName: item.bankAccountName || "",
      unitSekolahId: item.unitSekolahId,
      isActive: item.isActive
    })
    setIsAdding(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusGuru(deleteId)
      setData(data.filter(d => d.id !== deleteId))
      toast.success("Data guru berhasil dihapus")
      setDeleteId(null)
    } catch (err: any) {
      toast.error("Gagal menghapus data: " + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    if (selectedGurus.length === 0) return
    setIsDeletingBulk(true)
    try {
      await hapusGuruMassal(selectedGurus)
      setData(data.filter(d => !selectedGurus.includes(d.id)))
      toast.success(`Berhasil menghapus ${selectedGurus.length} data guru`)
      setSelectedGurus([])
      setShowBulkDeleteModal(false)
    } catch (err: any) {
      toast.error("Gagal menghapus data massal: " + err.message)
    } finally {
      setIsDeletingBulk(false)
    }
  }

  const handleSaveModal = async (modalData: any) => {
    if (!modalData.name?.trim()) {
      toast.error("Nama lengkap guru wajib diisi")
      throw new Error("Validation error")
    }
    if (!modalData.unitSekolahId) {
      toast.error("Unit sekolah wajib dipilih")
      throw new Error("Validation error")
    }

    setIsSubmitting(true)
    try {
      if (modalData.id) {
        const res = await editGuru(modalData.id, modalData)
        const updatedUnit = schoolUnits.find(u => u.id === modalData.unitSekolahId)
        setData(data.map(d => d.id === modalData.id ? { ...res, unitSekolah: updatedUnit } as unknown as Guru : d))
        toast.success("Data guru berhasil diperbarui")
      } else {
        const res = await tambahGuru(modalData)
        const updatedUnit = schoolUnits.find(u => u.id === modalData.unitSekolahId)
        setData([...data, { ...res, unitSekolah: updatedUnit } as unknown as Guru])
        toast.success("Guru baru berhasil ditambahkan")
      }
      setIsAdding(false)
      setFormData(defaultForm)
    } catch (err: any) {
      toast.error("Gagal menyimpan data: " + (err.message || "Terjadi kesalahan"))
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (activeUnitId && activeUnitId !== "all" && item.unitSekolahId !== activeUnitId) return false
      if ((!activeUnitId || activeUnitId === "all") && unitFilter && item.unitSekolahId !== unitFilter) return false
      if (statusFilter) {
        if (statusFilter === "-") {
          if (item.statusKepegawaian && item.statusKepegawaian !== "-") return false
        } else {
          if (item.statusKepegawaian !== statusFilter) return false
        }
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchName = item.name.toLowerCase().includes(q)
        const matchNip = (item.nip || "").toLowerCase().includes(q)
        const matchBidang = (item.bidangStudi?.name || "").toLowerCase().includes(q)
        if (!matchName && !matchNip && !matchBidang) return false
      }
      return true
    })
  }, [data, activeUnitId, statusFilter, searchTerm, unitFilter])

  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData)

  const paginatedData = useMemo(() => {
    return sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [sortedData, currentPage, pageSize])

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>()
    let hasEmpty = false
    data.forEach(item => {
      if (item.statusKepegawaian && item.statusKepegawaian !== "-") {
        statuses.add(item.statusKepegawaian)
      } else {
        hasEmpty = true
      }
    })
    
    const options = Array.from(statuses).sort().map(status => ({
      value: status,
      label: status
    }))

    if (hasEmpty) {
      options.push({ value: "-", label: "Belum Diisi (-)" })
    }

    return options
  }, [data])

  const computedTotalPages = Math.ceil(filteredData.length / pageSize)

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      toast.error("Tidak ada data guru untuk diekspor")
      return
    }
    setIsExportingExcel(true)
    try {
      const { exportToExcel } = await import("@/lib/excel")
      const mappedData = filteredData.map((g, idx) => ({
        "No": idx + 1,
        "NIP / NUPTK / NIK": g.nip || "-",
        "Nama Lengkap": g.name,
        "Gender": g.gender,
        "Unit Sekolah": g.unitSekolah?.name || "-",
        "Status": g.statusKepegawaian,
        "Pendidikan": g.pendidikan || "-",
        "Bidang Studi / Tugas": g.bidangStudi?.name || "-",
        "No. WhatsApp": g.phone || "-",
        "Email": g.email || "-",
        "Nama Bank": g.bankName || "-",
        "No. Rekening": g.bankAccount || "-",
        "Atas Nama": g.bankAccountName || "-"
      }))
      const unitObj = activeUnitId ? schoolUnits.find(u => u.id === activeUnitId) : undefined
      const unitName = unitObj?.name || "Semua_Unit"
      const dateStr = new Date().toISOString().split('T')[0]
      exportToExcel(mappedData, `Data_Guru_${unitName}_${dateStr}`.replace(/\s+/g, '_'), {
        title: "Daftar Data Guru",
        unitInfo: unitObj || { name: pengaturan?.namaYayasan || "Yayasan Siraya" }
      })
      toast.success("Berhasil mengunduh Excel Data Guru")
    } catch (err: any) {
      toast.error("Gagal ekspor Excel: " + err.message)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    if (filteredData.length === 0) {
      toast.error("Tidak ada data guru untuk diekspor")
      return
    }
    setIsExportingPDF(true)
    try {
      const { exportTablePdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo, getSignatoryKiri } = await import("@/lib/pdf-helpers")
      const unitObj = schoolUnits.find((u: any) => u.id === activeUnitId)
      const dateStr = new Date().toISOString().split('T')[0]

      const headers = ["No", "NIP / NIK", "Nama Lengkap & Gelar", "Unit", "Status", "Pendidikan", "No. WA"]
      const pdfRows = filteredData.map((g, idx) => [
        idx + 1,
        g.nip || "-",
        g.name,
        g.unitSekolah?.name || "-",
        g.statusKepegawaian,
        g.pendidikan || "-",
        g.phone || "-"
      ])

      exportTablePdf({
        institutionInfo: buildInstitutionInfo(pengaturan, unitObj),
        title: "Daftar Guru & Staf Kepegawaian",
        subtitle: `Unit: ${unitObj?.name || "Semua Unit"} • Total: ${filteredData.length} Orang`,
        headers,
        data: pdfRows,
        filename: `Daftar_Guru_${unitObj?.name || "Semua"}_${dateStr}`.replace(/\s+/g, '_'),
        config: { orientation: 'landscape' },
        penandatanganKiri: getSignatoryKiri(pengaturan, unitObj),
        penandatanganKanan: {
          jabatan: "Petugas Administrasi,",
          nama: userName || "____________________"
        }
      })
      toast.success("Berhasil mengunduh PDF Daftar Guru")
    } catch (err: any) {
      toast.error("Gagal ekspor PDF: " + err.message)
    } finally {
      setIsExportingPDF(false)
    }
  }

  const formatWhatsAppUrl = (phone: string | null) => {
    if (!phone) return undefined
    let clean = phone.replace(/\D/g, "")
    if (clean.startsWith("0")) clean = "62" + clean.slice(1)
    return `https://wa.me/${clean}`
  }

  return (
    <div className="space-y-6">
      {/* Executive Teacher KPI Banner for KEPALA_SEKOLAH */}
      {isReadOnly && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-[#065f32] border border-emerald-200/80">
                  Ringkasan Eksekutif Tenaga Pendidik
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">Monitoring Beban & Kualifikasi Guru</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Komposisi & Kesiapan Guru Unit</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-50 px-3 py-1.5 rounded-xl text-slate-600 font-medium border border-slate-200">
                Pimpinan Unit • Mode Pengawasan
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tenaga Pendidik</p>
              <p className="text-2xl font-black mt-1 text-slate-900">{executiveMetrics.totalGuru} <span className="text-xs font-semibold text-slate-500">Guru</span></p>
              <p className="text-[11px] text-slate-500 mt-1">Seluruh jenjang aktif</p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Kepegawaian</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{executiveMetrics.totalTetap}</span>
                <span className="text-xs font-semibold text-[#065f32]">Tetap (GTY)</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-amber-700">{executiveMetrics.totalHonorer} Honorer</span>
              </div>
              <p className="text-[11px] text-[#065f32] font-semibold mt-1">{executiveMetrics.pctTetap}% Guru Tetap Yayasan</p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penugasan Wali Kelas</p>
              <p className="text-2xl font-black mt-1 text-slate-900">{executiveMetrics.totalWali} <span className="text-xs font-semibold text-slate-500">Guru</span></p>
              <p className="text-[11px] text-slate-500 mt-1">Memegang amanah wali rombel</p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kualifikasi Akademik</p>
              <p className="text-2xl font-black mt-1 text-slate-900">{executiveMetrics.pctS1Plus}% <span className="text-xs font-semibold text-slate-500">S1/S2</span></p>
              <p className="text-[11px] text-[#065f32] font-semibold mt-1">{executiveMetrics.totalS1Plus} guru berpendidikan tinggi</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        {/* Dummy Tab Navigation for UI Consistency */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button className="px-6 py-3 font-semibold text-sm border-b-2 border-primary text-primary transition-colors">
            {isReadOnly ? "Direktori & Beban Tenaga Pendidik" : "Daftar Guru & Staf Aktif"}
          </button>
        </div>

        {/* Top Filter & Toolbar */}
        <Toolbar>
          <ToolbarSearch 
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, NIP, tugas..."
          />

          <ToolbarFilter 
            icon={<Building2 size={14} />}
            value={activeUnitId && activeUnitId !== "all" ? activeUnitId : unitFilter}
            onChange={setUnitFilter}
            disabled={activeUnitId !== "all" && activeUnitId !== ""}
            options={[
              { value: "", label: "Semua Unit" },
              ...schoolUnits.map(u => ({ value: u.id, label: u.name }))
            ]}
          />

          <ToolbarFilter 
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "Semua Status" },
              ...availableStatuses
            ]}
          />

          <ToolbarActions>
            <ToolbarExportExcel 
              onClick={handleExportExcel} 
              disabled={filteredData.length === 0} 
              isExporting={isExportingExcel} 
            />
            <ToolbarExportPDF 
              onClick={handleExportPDF} 
              disabled={filteredData.length === 0} 
              isExporting={isExportingPDF} 
            />

            {!isReadOnly && (
              <ToolbarImportExcel onClick={() => setShowModalImportGuru(true)} />
            )}

            {!isReadOnly && (
              <>
                <ToolbarDivider />
                <ToolbarAddButton onClick={handleOpenAdd}>
                  Tambah Guru
                </ToolbarAddButton>
              </>
            )}
          </ToolbarActions>
        </Toolbar>

      {/* Data Table */}
      <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
              <tr>
                {!isReadOnly && (
                  <th className="p-4 font-semibold text-center w-12">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      checked={paginatedData.length > 0 && selectedGurus.length === paginatedData.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedGurus(paginatedData.map((g: any) => g.id))
                        else setSelectedGurus([])
                      }}
                    />
                  </th>
                )}
                <th className="p-4 font-semibold text-center w-12">NO</th>
                <SortableHeader label="PROFIL GURU" sortKey="name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-left" />
                <SortableHeader label="GENDER" sortKey="gender" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-center hidden sm:table-cell w-20" />
                <SortableHeader label="UNIT SEKOLAH" sortKey="unitSekolah.name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-left hidden md:table-cell" />
                <SortableHeader label="STATUS PEGAWAI" sortKey="statusKepegawaian" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-center hidden lg:table-cell" />
                <SortableHeader label="NO. WHATSAPP" sortKey="phone" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-left hidden xl:table-cell" />
                <SortableHeader label="STATUS" sortKey="isActive" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-center hidden xl:table-cell w-28" />
                <th className="p-4 font-semibold text-right">{isReadOnly ? "PROFIL" : "AKSI"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 7 : 9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      <GraduationCap className="w-12 h-12 stroke-[1.2] text-text-muted/40 mb-3" />
                      <p className="font-medium text-text-main">Belum Ada Data Guru</p>
                      <p className="text-xs mt-1">Gunakan tombol + Tambah Guru untuk memasukkan data kepegawaian baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const absoluteIdx = (currentPage - 1) * pageSize + idx + 1
                  const waUrl = formatWhatsAppUrl(item.phone)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      {!isReadOnly && (
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            checked={selectedGurus.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedGurus([...selectedGurus, item.id])
                              else setSelectedGurus(selectedGurus.filter(id => id !== item.id))
                            }}
                          />
                        </td>
                      )}
                      <td className="p-4 text-center text-text-main">{absoluteIdx}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 border flex items-center justify-center ${
                            item.gender === "Perempuan" 
                              ? "bg-rose-50 border-rose-100 text-rose-500" 
                              : "bg-blue-50 border-blue-100 text-blue-500"
                          }`}>
                            <User size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-text-main">
                              {item.name}
                            </div>
                            <div className="font-mono text-xs text-text-muted mt-0.5">
                              {item.nip || "NIP Belum Diatur"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center hidden sm:table-cell">
                        <span className="font-semibold text-text-main">{item.gender === "Perempuan" ? "P" : "L"}</span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="font-medium text-text-main">{item.unitSekolah?.name || "-"}</div>
                      </td>
                      <td className="p-4 text-center hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.statusKepegawaian === "GTY" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          item.statusKepegawaian === "PNS" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                          "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}>
                          {item.statusKepegawaian || "-"}
                        </span>
                      </td>
                      <td className="p-4 hidden xl:table-cell">
                        {item.phone ? (
                          <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            <Phone size={14} />
                            {item.phone}
                          </a>
                        ) : (
                          <span className="text-text-muted/60 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center hidden xl:table-cell">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[11px] font-medium border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[11px] font-medium border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Nonaktif
                          </span>
                        )}
                      </td>
                      {isReadOnly ? (
                        <td className="p-4 text-right">
                          <Link
                            href={`/guru/${item.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors font-bold text-xs"
                          >
                            <Eye size={14} /> Profil 360°
                          </Link>
                        </td>
                      ) : (
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/guru/${item.id}`}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors"
                              title="Detail 360°"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-600 transition-colors"
                              title="Edit Data"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-600 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {computedTotalPages > 0 && (
          <div className="pt-4 mt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-muted">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 bg-bg border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50"
              >
                {[5, 10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <span className="px-4 py-1.5 text-sm font-medium text-text-main">
                Hal {currentPage} dari {computedTotalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(computedTotalPages, p + 1))}
                disabled={currentPage === computedTotalPages}
                className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>



      {/* Modular 4-Tab Guru Form Modal */}
      <GuruFormModal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        onSave={handleSaveModal}
        initialData={formData}
        schoolUnits={schoolUnits}
        availableStatuses={availableStatuses}
      />

      <ImportGuruModal
        isOpen={showModalImportGuru}
        onClose={() => setShowModalImportGuru(false)}
        onSuccess={() => {
          setShowModalImportGuru(false)
          // Data is refreshed via router.refresh() inside the modal
        }}
        schoolUnits={schoolUnits}
        activeUnitId={activeUnitId}
      />

      {/* Floating Action Bar (Bulk Action) */}
      {selectedGurus.length > 0 && !isReadOnly && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border px-4 py-3 flex items-center justify-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300 z-50 w-max max-w-[98vw] overflow-x-auto hide-scrollbar text-sm">
          <div className="flex items-center gap-2 font-semibold shrink-0">
            <span className="flex items-center justify-center bg-primary/10 text-primary w-5 h-5 rounded-full text-[10px]">{selectedGurus.length}</span>
            <span className="hidden sm:inline">Guru</span> Dipilih
          </div>
          <div className="h-6 w-px bg-border shrink-0"></div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs py-1.5 px-3 shrink-0" onClick={() => setShowBulkDeleteModal(true)} disabled={isDeletingBulk} isLoading={isDeletingBulk}>
              Hapus Terpilih
            </Button>
            <button onClick={() => setSelectedGurus([])} className="text-gray-400 hover:text-gray-600 p-1.5 ml-1 bg-gray-100 rounded-full shrink-0">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onCancel={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Hapus Massal Guru"
        message={`Apakah Anda yakin ingin menghapus ${selectedGurus.length} guru terpilih secara permanen? Guru yang dihapus tidak akan muncul pada pilihan Wali Kelas.`}
        confirmText="Ya, Hapus Semua"
        cancelText="Batal"
        isLoading={isDeletingBulk}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Guru"
        message="Apakah Anda yakin ingin menghapus data guru ini? Guru yang dihapus tidak akan muncul pada pilihan Wali Kelas."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isLoading={isDeleting}
      />
    </div>
  )
}

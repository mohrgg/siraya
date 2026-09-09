"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { 
  Edit2, 
  Trash2, 
  GraduationCap, 
  Building2, 
  User, 
  Users, 
  Award, 
  X, 
  Eye, 
  Phone,
  Briefcase
} from "lucide-react"
import { 
  isStatusTetap, 
  isStatusHonorer, 
  isValidMonitoringStatus, 
  getStatusBadgeStyle, 
  normalizeStatusKepegawaian 
} from "@/lib/constants/kepegawaian"
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
  jenisPtk?: string
  jabatan?: string | null
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
  const isReadOnly = userRole === "KEPALA_SEKOLAH" || userRole === "YAYASAN"

  const [data, setData] = useState<Guru[]>(initialData)
  
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Dedicated Tab: "GURU" (Tenaga Pendidik) vs "STAF" (Tenaga Kependidikan)
  const [activeTab, setActiveTab] = useState<"GURU" | "STAF">("GURU")

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
  }, [activeUnitId, activeTab, statusFilter, searchTerm, unitFilter])

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
    statusKepegawaian: "",
    jenisPtk: activeTab as string,
    jabatan: "",
    pendidikan: "S1",
    bidangStudiId: "",
    bankName: "",
    bankAccount: "",
    bankAccountName: "",
    unitSekolahId: schoolUnits[0]?.id || "",
    isActive: true
  }

  const [formData, setFormData] = useState<any>(defaultForm)

  // Scope data to unit filter
  const scopedData = useMemo(() => {
    return data.filter(item => {
      if (activeUnitId && activeUnitId !== "all" && item.unitSekolahId !== activeUnitId) return false
      if ((!activeUnitId || activeUnitId === "all") && unitFilter && item.unitSekolahId !== unitFilter) return false
      return true
    })
  }, [data, activeUnitId, unitFilter])

  // Split into Guru and Staf lists
  const guruList = useMemo(() => {
    return scopedData.filter(item => (item.jenisPtk || "GURU") === "GURU")
  }, [scopedData])

  const stafList = useMemo(() => {
    return scopedData.filter(item => item.jenisPtk === "STAF")
  }, [scopedData])

  const currentTabList = useMemo(() => {
    return activeTab === "GURU" ? guruList : stafList
  }, [activeTab, guruList, stafList])

  // Dynamic Executive KPI Metrics per active tab
  const executiveMetrics = useMemo(() => {
    if (activeTab === "GURU") {
      const totalGuru = guruList.length
      const totalAktif = guruList.filter(g => g.isActive).length
      const totalWali = guruList.filter(g => g.rombelWali && g.rombelWali.length > 0).length
      const totalS1Plus = guruList.filter(g => g.pendidikan && (g.pendidikan.includes("S1") || g.pendidikan.includes("S2") || g.pendidikan.includes("S3"))).length
      const pctS1Plus = totalGuru > 0 ? Math.round((totalS1Plus / totalGuru) * 100) : 0

      return {
        card1Title: "Total Tenaga Pendidik",
        card1Value: totalGuru,
        card1Sub: `(${totalAktif} Aktif)`,
        card1Icon: Users,
        card1Color: "bg-primary/10 text-primary",
        card2Title: "Penugasan Wali",
        card2Value: totalWali,
        card2Sub: "Wali Kelas",
        card2Icon: GraduationCap,
        card2Color: "bg-violet-50 text-violet-600",
        card3Title: "Kualifikasi S1/S2",
        card3Value: `${pctS1Plus}%`,
        card3Sub: `(${totalS1Plus} Sarjana)`,
        card3Icon: Award,
        card3Color: "bg-amber-50 text-amber-600"
      }
    } else {
      const totalStaf = stafList.length
      const totalAktif = stafList.filter(s => s.isActive).length
      const totalTetap = stafList.filter(s => isStatusTetap(s.statusKepegawaian)).length
      const totalHonorer = stafList.filter(s => isStatusHonorer(s.statusKepegawaian)).length
      const pctTetap = totalStaf > 0 ? Math.round((totalTetap / totalStaf) * 100) : 0

      return {
        card1Title: "Total Tenaga Kependidikan",
        card1Value: totalStaf,
        card1Sub: `(${totalAktif} Aktif)`,
        card1Icon: Users,
        card1Color: "bg-primary/10 text-primary",
        card2Title: "Staf Tetap Yayasan",
        card2Value: totalTetap,
        card2Sub: `(${pctTetap}% dari total)`,
        card2Icon: Award,
        card2Color: "bg-emerald-50 text-emerald-600",
        card3Title: "Kontrak & Honorer",
        card3Value: totalHonorer,
        card3Sub: "Orang Staf",
        card3Icon: Briefcase,
        card3Color: "bg-blue-50 text-blue-600"
      }
    }
  }, [activeTab, guruList, stafList])

  const handleOpenAdd = () => {
    setFormData({
      ...defaultForm,
      jenisPtk: activeTab,
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
      statusKepegawaian: item.statusKepegawaian && item.statusKepegawaian !== "-" ? item.statusKepegawaian : "",
      jenisPtk: item.jenisPtk || "GURU",
      jabatan: item.jabatan || "",
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
      toast.success(activeTab === "STAF" ? "Data staf berhasil dihapus" : "Data guru berhasil dihapus")
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
      toast.success(`Berhasil menghapus ${selectedGurus.length} data ${activeTab === "STAF" ? "staf" : "guru"}`)
      setSelectedGurus([])
      setShowBulkDeleteModal(false)
    } catch (err: any) {
      toast.error("Gagal menghapus data massal: " + err.message)
    } finally {
      setIsDeletingBulk(false)
    }
  }

  const handleSaveModal = async (modalData: any) => {
    const isStaf = modalData.jenisPtk === "STAF"
    if (!modalData.name?.trim()) {
      toast.error(isStaf ? "Nama lengkap staf wajib diisi" : "Nama lengkap guru wajib diisi")
      throw new Error("Validation error")
    }
    if (!modalData.unitSekolahId) {
      toast.error("Unit penugasan wajib dipilih")
      throw new Error("Validation error")
    }
    if (isStaf && !modalData.jabatan?.trim()) {
      toast.error("Jabatan staf wajib dipilih atau diisi")
      throw new Error("Validation error")
    }

    setIsSubmitting(true)
    try {
      if (modalData.id) {
        const res = await editGuru(modalData.id, modalData)
        const updatedUnit = schoolUnits.find(u => u.id === modalData.unitSekolahId)
        setData(data.map(d => d.id === modalData.id ? { ...res, unitSekolah: updatedUnit } as unknown as Guru : d))
        toast.success(isStaf ? "Data staf berhasil diperbarui" : "Data guru berhasil diperbarui")
      } else {
        const res = await tambahGuru(modalData)
        const updatedUnit = schoolUnits.find(u => u.id === modalData.unitSekolahId)
        setData([...data, { ...res, unitSekolah: updatedUnit } as unknown as Guru])
        toast.success(isStaf ? "Staf baru berhasil ditambahkan" : "Guru baru berhasil ditambahkan")
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

  // Filter within the current tab
  const filteredData = useMemo(() => {
    return currentTabList.filter(item => {
      if (statusFilter) {
        if (statusFilter === "UNASSIGNED") {
          if (isValidMonitoringStatus(item.statusKepegawaian)) return false
        } else {
          if (normalizeStatusKepegawaian(item.statusKepegawaian) !== statusFilter) return false
        }
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchName = item.name.toLowerCase().includes(q)
        const matchNip = (item.nip || "").toLowerCase().includes(q)
        const matchPhone = (item.phone || "").toLowerCase().includes(q)
        const matchBidang = (item.bidangStudi?.name || "").toLowerCase().includes(q)
        const matchJabatan = (item.jabatan || "").toLowerCase().includes(q)
        if (!matchName && !matchNip && !matchPhone && !matchBidang && !matchJabatan) return false
      }
      return true
    })
  }, [currentTabList, statusFilter, searchTerm])

  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData)

  const paginatedData = useMemo(() => {
    return sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [sortedData, currentPage, pageSize])

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>()
    let hasUnassigned = false
    currentTabList.forEach(item => {
      const norm = normalizeStatusKepegawaian(item.statusKepegawaian)
      if (norm && norm !== "UNASSIGNED" && norm !== "Belum Ditentukan") {
        statuses.add(norm)
      } else {
        hasUnassigned = true
      }
    })
    
    const options = Array.from(statuses).sort().map(status => ({
      value: status,
      label: status
    }))

    if (hasUnassigned) {
      options.push({ value: "UNASSIGNED", label: "Belum Ditentukan" })
    }

    const seen = new Set<string>()
    return options.filter(opt => {
      if (seen.has(opt.value)) return false
      seen.add(opt.value)
      return true
    })
  }, [currentTabList])

  const computedTotalPages = Math.ceil(filteredData.length / pageSize)

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      toast.error(`Tidak ada data ${activeTab === "STAF" ? "staf" : "guru"} untuk diekspor`)
      return
    }
    setIsExportingExcel(true)
    try {
      const { exportToExcel } = await import("@/lib/excel")
      const isStaf = activeTab === "STAF"
      const mappedData = filteredData.map((g, idx) => {
        const row: any = {
          "No": idx + 1,
          "NIP / NUPTK / NIK": g.nip || "-",
          "Nama Lengkap": g.name,
          "Gender": g.gender,
          "Unit": g.unitSekolah?.name || "-",
          "Status Kepegawaian": g.statusKepegawaian || "-",
          "Pendidikan": g.pendidikan || "-"
        }
        if (isStaf) {
          row["Jabatan / Posisi"] = g.jabatan || "-"
        } else {
          row["Bidang Studi / Mapel"] = g.bidangStudi?.name || "-"
        }
        row["No. WhatsApp"] = g.phone || "-"
        row["Email"] = g.email || "-"
        row["Nama Bank"] = g.bankName || "-"
        row["No. Rekening"] = g.bankAccount || "-"
        row["Atas Nama"] = g.bankAccountName || "-"
        return row
      })
      const unitObj = activeUnitId ? schoolUnits.find(u => u.id === activeUnitId) : undefined
      const unitName = unitObj?.name || "Semua_Unit"
      const dateStr = new Date().toISOString().split('T')[0]
      const title = isStaf ? "Daftar Staf & Karyawan (Tendik)" : "Daftar Guru (Tenaga Pendidik)"
      const filename = `${isStaf ? "Data_Staf" : "Data_Guru"}_${unitName}_${dateStr}`.replace(/\s+/g, '_')

      exportToExcel(mappedData, filename, {
        title,
        unitInfo: unitObj || { name: pengaturan?.namaYayasan || "Yayasan Siraya" }
      })
      toast.success(`Berhasil mengunduh Excel ${isStaf ? "Data Staf" : "Data Guru"}`)
    } catch (err: any) {
      toast.error("Gagal ekspor Excel: " + err.message)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    if (filteredData.length === 0) {
      toast.error(`Tidak ada data ${activeTab === "STAF" ? "staf" : "guru"} untuk diekspor`)
      return
    }
    setIsExportingPDF(true)
    try {
      const { exportTablePdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo, getSignatoryKiri } = await import("@/lib/pdf-helpers")
      const unitObj = schoolUnits.find((u: any) => u.id === activeUnitId)
      const dateStr = new Date().toISOString().split('T')[0]
      const isStaf = activeTab === "STAF"

      const headers = isStaf
        ? ["No", "NIP / NIK", "Nama Lengkap", "Unit", "Jabatan", "Status", "No. WA"]
        : ["No", "NIP / NIK", "Nama Lengkap & Gelar", "Unit", "Bidang Studi", "Status", "No. WA"]

      const pdfRows = filteredData.map((g, idx) => [
        idx + 1,
        g.nip || "-",
        g.name,
        g.unitSekolah?.name || "-",
        isStaf ? (g.jabatan || "-") : (g.bidangStudi?.name || "-"),
        g.statusKepegawaian || "-",
        g.phone || "-"
      ])

      const title = isStaf ? "Daftar Staf & Karyawan (Tendik)" : "Daftar Guru (Tenaga Pendidik)"
      const filename = `${isStaf ? "Daftar_Staf" : "Daftar_Guru"}_${unitObj?.name || "Semua"}_${dateStr}`.replace(/\s+/g, '_')

      exportTablePdf({
        institutionInfo: buildInstitutionInfo(pengaturan, unitObj),
        title,
        subtitle: `Unit: ${unitObj?.name || "Semua Unit"} • Total: ${filteredData.length} Orang`,
        headers,
        data: pdfRows,
        filename,
        config: { orientation: 'landscape' },
        penandatanganKiri: getSignatoryKiri(pengaturan, unitObj),
        penandatanganKanan: {
          jabatan: "Petugas Administrasi,",
          nama: userName || "____________________"
        }
      })
      toast.success(`Berhasil mengunduh PDF ${isStaf ? "Daftar Staf" : "Daftar Guru"}`)
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

  const IconCard1 = executiveMetrics.card1Icon
  const IconCard2 = executiveMetrics.card2Icon
  const IconCard3 = executiveMetrics.card3Icon

  return (
    <div className="space-y-6">
      {/* 3 Card KPI Dinamis (Sesuai Tab Guru vs Tab Staf) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4">
          <div className={`w-10 h-10 rounded-xl ${executiveMetrics.card1Color} flex items-center justify-center shrink-0`}>
            <IconCard1 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
              {executiveMetrics.card1Title}
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main">{executiveMetrics.card1Value}</span>
              <span className="text-[11px] font-medium text-emerald-600">{executiveMetrics.card1Sub}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4">
          <div className={`w-10 h-10 rounded-xl ${executiveMetrics.card2Color} flex items-center justify-center shrink-0`}>
            <IconCard2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
              {executiveMetrics.card2Title}
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main">{executiveMetrics.card2Value}</span>
              <span className="text-[11px] font-medium text-text-muted">{executiveMetrics.card2Sub}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4">
          <div className={`w-10 h-10 rounded-xl ${executiveMetrics.card3Color} flex items-center justify-center shrink-0`}>
            <IconCard3 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
              {executiveMetrics.card3Title}
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main">{executiveMetrics.card3Value}</span>
              <span className="text-[11px] font-medium text-emerald-600">{executiveMetrics.card3Sub}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Unified Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        {/* Tab Header Wajib Siraya: Clean Antislop UI & Mobile 44px Touch Targets */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto hide-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
          <button 
            type="button"
            onClick={() => {
              setActiveTab("GURU")
              setSelectedGurus([])
              setStatusFilter("")
              setSearchTerm("")
            }}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap min-h-[44px] shrink-0 ${
              activeTab === "GURU"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main hover:border-border"
            }`}
          >
            <span>Guru (Tenaga Pendidik)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === "GURU" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
            }`}>
              {guruList.length}
            </span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setActiveTab("STAF")
              setSelectedGurus([])
              setStatusFilter("")
              setSearchTerm("")
            }}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap min-h-[44px] shrink-0 ${
              activeTab === "STAF"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main hover:border-border"
            }`}
          >
            <span>Staf & Karyawan (Tendik)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === "STAF" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
            }`}>
              {stafList.length}
            </span>
          </button>
        </div>

        {/* Top Filter & Toolbar */}
        <Toolbar>
          <ToolbarSearch 
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder={activeTab === "GURU" ? "Cari guru, NIP, mapel..." : "Cari staf, NIP, jabatan..."}
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
                  {activeTab === "GURU" ? "Tambah Guru" : "Tambah Staf"}
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
                <SortableHeader 
                  label={activeTab === "GURU" ? "PROFIL GURU" : "PROFIL PEGAWAI"} 
                  sortKey="name" 
                  currentSortKey={sortConfig?.key as string} 
                  currentDirection={sortConfig?.direction} 
                  onSort={requestSort as any} 
                  className="text-left" 
                />
                <SortableHeader 
                  label="GENDER" 
                  sortKey="gender" 
                  currentSortKey={sortConfig?.key as string} 
                  currentDirection={sortConfig?.direction} 
                  onSort={requestSort as any} 
                  className="text-center hidden sm:table-cell w-20" 
                />
                <SortableHeader 
                  label={activeTab === "GURU" ? "UNIT SEKOLAH" : "UNIT / KANTOR"} 
                  sortKey="unitSekolah.name" 
                  currentSortKey={sortConfig?.key as string} 
                  currentDirection={sortConfig?.direction} 
                  onSort={requestSort as any} 
                  className="text-left hidden md:table-cell" 
                />
                {activeTab === "GURU" ? (
                  <SortableHeader 
                    label="BIDANG STUDI" 
                    sortKey="bidangStudi.name" 
                    currentSortKey={sortConfig?.key as string} 
                    currentDirection={sortConfig?.direction} 
                    onSort={requestSort as any} 
                    className="text-left hidden lg:table-cell" 
                  />
                ) : (
                  <SortableHeader 
                    label="JABATAN / POSISI" 
                    sortKey="jabatan" 
                    currentSortKey={sortConfig?.key as string} 
                    currentDirection={sortConfig?.direction} 
                    onSort={requestSort as any} 
                    className="text-left hidden lg:table-cell" 
                  />
                )}
                <SortableHeader 
                  label="STATUS PEGAWAI" 
                  sortKey="statusKepegawaian" 
                  currentSortKey={sortConfig?.key as string} 
                  currentDirection={sortConfig?.direction} 
                  onSort={requestSort as any} 
                  className="text-center hidden lg:table-cell" 
                />
                <SortableHeader 
                  label="NO. WHATSAPP" 
                  sortKey="phone" 
                  currentSortKey={sortConfig?.key as string} 
                  currentDirection={sortConfig?.direction} 
                  onSort={requestSort as any} 
                  className="text-left hidden xl:table-cell" 
                />
                <SortableHeader 
                  label="STATUS" 
                  sortKey="isActive" 
                  currentSortKey={sortConfig?.key as string} 
                  currentDirection={sortConfig?.direction} 
                  onSort={requestSort as any} 
                  className="text-center hidden xl:table-cell w-28" 
                />
                <th className="p-4 font-semibold text-right">{isReadOnly ? "PROFIL" : "AKSI"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 8 : 10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      {activeTab === "GURU" ? (
                        <GraduationCap className="w-12 h-12 stroke-[1.2] text-text-muted/40 mb-3" />
                      ) : (
                        <Briefcase className="w-12 h-12 stroke-[1.2] text-text-muted/40 mb-3" />
                      )}
                      <p className="font-medium text-text-main">
                        {activeTab === "GURU" ? "Belum Ada Data Guru" : "Belum Ada Data Staf & Karyawan"}
                      </p>
                      <p className="text-xs mt-1">
                        {activeTab === "GURU" 
                          ? "Gunakan tombol + Tambah Guru untuk memasukkan data tenaga pendidik baru."
                          : "Gunakan tombol + Tambah Staf untuk memasukkan data tenaga kependidikan baru."}
                      </p>
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
                          <div className="min-w-0">
                            <div className="font-bold text-text-main truncate">
                              {item.name}
                            </div>
                            <div className="font-mono text-xs text-text-muted mt-0.5 truncate">
                              {item.nip || "NIP Belum Diatur"}
                            </div>
                            {/* Responsive mobile badge (antislop-layoutmobile) */}
                            <div className="flex items-center gap-1.5 mt-1 md:hidden flex-wrap">
                              <span className="text-[11px] text-text-muted font-medium">{item.unitSekolah?.name || "-"}</span>
                              {activeTab === "STAF" ? (
                                item.jabatan && (
                                  <span className="text-[10px] bg-gray-100 text-text-main px-1.5 py-0.5 rounded font-semibold border border-border">
                                    {item.jabatan}
                                  </span>
                                )
                              ) : (
                                item.bidangStudi?.name && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                                    {item.bidangStudi.name}
                                  </span>
                                )
                              )}
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
                      {activeTab === "GURU" ? (
                        <td className="p-4 hidden lg:table-cell">
                          {item.bidangStudi?.name ? (
                            <span className="font-medium text-text-main">
                              {item.bidangStudi.name}
                            </span>
                          ) : (
                            <span className="text-text-muted/60 text-xs italic">Belum Diatur</span>
                          )}
                        </td>
                      ) : (
                        <td className="p-4 hidden lg:table-cell">
                          {item.jabatan ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-text-main border border-border">
                              {item.jabatan}
                            </span>
                          ) : (
                            <span className="text-text-muted/60 text-xs italic">Staf Umum</span>
                          )}
                        </td>
                      )}
                      <td className="p-4 text-center hidden lg:table-cell">
                        {isValidMonitoringStatus(item.statusKepegawaian) ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(item.statusKepegawaian)}`}>
                            {normalizeStatusKepegawaian(item.statusKepegawaian)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200" title="Status kepegawaian belum ditentukan">
                            Belum Ditentukan
                          </span>
                        )}
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
      />

      <ImportGuruModal
        isOpen={showModalImportGuru}
        onClose={() => setShowModalImportGuru(false)}
        onSuccess={() => {
          setShowModalImportGuru(false)
        }}
        schoolUnits={schoolUnits}
        activeUnitId={activeUnitId}
      />

      {/* Floating Action Bar (Bulk Action) */}
      {selectedGurus.length > 0 && !isReadOnly && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border px-4 py-3 flex items-center justify-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300 z-50 w-max max-w-[98vw] overflow-x-auto hide-scrollbar text-sm">
          <div className="flex items-center gap-2 font-semibold shrink-0">
            <span className="flex items-center justify-center bg-primary/10 text-primary w-5 h-5 rounded-full text-[10px]">{selectedGurus.length}</span>
            <span className="hidden sm:inline">{activeTab === "STAF" ? "Staf" : "Guru"}</span> Dipilih
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
        title={`Hapus Massal ${activeTab === "STAF" ? "Staf" : "Guru"}`}
        message={`Apakah Anda yakin ingin menghapus ${selectedGurus.length} ${activeTab === "STAF" ? "staf" : "guru"} terpilih secara permanen?`}
        confirmText="Ya, Hapus Semua"
        cancelText="Batal"
        isLoading={isDeletingBulk}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title={activeTab === "STAF" ? "Hapus Data Staf" : "Hapus Data Guru"}
        message={`Apakah Anda yakin ingin menghapus data ${activeTab === "STAF" ? "staf" : "guru"} ini?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isLoading={isDeleting}
      />
    </div>
  )
}

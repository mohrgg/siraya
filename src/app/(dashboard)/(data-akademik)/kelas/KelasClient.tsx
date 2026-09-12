"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { useKelasData } from "./hooks/useKelasData"
import KelasToolbar from "./components/KelasToolbar"
import TabKelas from "./components/TabKelas"
import TabSubKelas from "./components/TabSubKelas"
import TabMurid from "./components/TabMurid"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { DeleteWarningModal } from "@/components/ui/DeleteWarningModal"
import { Button } from "@/components/ui/Button"
import { X, Users, Layers, BarChart3, GraduationCap } from "lucide-react"
import { TabNavigation } from "@/components/ui/TabNavigation"
import ImportMuridModal from "@/components/modals/ImportMuridModal"
import MuridFormModal from "@/components/modals/MuridFormModal"
import TingkatFormModal from "./components/TingkatFormModal"
import SubKelasFormModal from "./components/SubKelasFormModal"
import SubKelasDetailDrawer from "./components/SubKelasDetailDrawer"
import ReactivateSiswaModal from "./components/ReactivateSiswaModal"
import { tambahKelas, editKelas, hapusKelas, hapusTingkatan, tambahTingkatan, editTingkatan } from "@/actions/kelas"
import { hapusSiswa, tambahSiswa, editSiswa } from "@/actions/siswa"

export default function KelasClient({
  activeUnitId, activeYearId, initialGrades, initialMajors, initialClassrooms, initialStudents, academicYears, schoolUnits, initialTeachers = [], userRole, userName, pengaturan
}: {
  activeUnitId?: string, activeYearId?: string, initialGrades: any[], initialMajors: any[], initialClassrooms: any[], initialStudents: any[], academicYears: any[], schoolUnits: any[], initialTeachers?: any[], userRole?: string, userName?: string, pengaturan?: any
}) {
  const isReadOnly = userRole === "KEPALA_SEKOLAH" || userRole === "YAYASAN"
  const router = useRouter()
  const data = useKelasData({ activeUnitId, activeYearId, initialGrades, initialMajors, initialClassrooms, initialStudents, academicYears, schoolUnits, userRole })

  // Executive Metrics for Kepala Sekolah
  const executiveMetrics = useMemo(() => {
    const totalRombel = data.classrooms.length
    const totalMuridInRombel = data.classrooms.reduce((acc: number, c: any) => acc + (c._count?.riwayatKelas || 0), 0)
    const avgPerRombel = totalRombel > 0 ? Math.round(totalMuridInRombel / totalRombel) : 0
    const rombelOvercapacity = data.classrooms.filter((c: any) => (c._count?.riwayatKelas || 0) > 36).length
    const rombelIdeal = data.classrooms.filter((c: any) => (c._count?.riwayatKelas || 0) >= 20 && (c._count?.riwayatKelas || 0) <= 36).length
    const rombelMinim = data.classrooms.filter((c: any) => (c._count?.riwayatKelas || 0) < 20).length
    const rombelWithWali = data.classrooms.filter((c: any) => c.waliKelasGuruId || c.waliKelas).length
    const rombelNoWali = totalRombel - rombelWithWali

    return {
      totalRombel,
      totalMuridInRombel,
      avgPerRombel,
      rombelOvercapacity,
      rombelIdeal,
      rombelMinim,
      rombelWithWali,
      rombelNoWali
    }
  }, [data.classrooms])

  // Modals Local State (Keep here since they trigger API mutations that might affect data)
  const [showModalMurid, setShowModalMurid] = useState(false)
  const [showModalKelas, setShowModalKelas] = useState(false)
  const [showModalSubKelas, setShowModalSubKelas] = useState(false)
  const [showModalImportMurid, setShowModalImportMurid] = useState(false)

  const [viewDetailMurid, setViewDetailMurid] = useState<any>(null)
  const [viewDetailSubKelas, setViewDetailSubKelas] = useState<any>(null)
  const [reactivateMurid, setReactivateMurid] = useState<{ id: string, name: string } | null>(null)

  const [deleteData, setDeleteData] = useState<{ id: string, type: "tingkat" | "subkelas" | "murid" } | null>(null)
  const [bulkActionConfirm, setBulkActionConfirm] = useState<{ type: "lulus" | "hapus" | "pindah" } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Forms
  const [formMurid, setFormMurid] = useState<any>({
    id: "", nisn: "", name: "", unitSekolahId: schoolUnits[0]?.id || "", subKelasId: "",
    previousSchool: "", phone: "", birthDate: "", email: "", studentStatus: "AKTIF",
    parentName: "", parentPhone: "", religion: "Islam", gender: "Laki-laki",
    address: "", formNo: "", username: ""
  })
  const [formKelas, setFormKelas] = useState({ id: "", name: "", order: 1, unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
  const [formSubKelas, setFormSubKelas] = useState({ id: "", name: "", tingkatId: "", jurusanId: "", tahunAkademikId: activeYearId || academicYears[0]?.id || "", unitSekolahId: activeUnitId || schoolUnits[0]?.id || "", waliKelasGuruId: "", waliKelas: "", waliKelasPhone: "" })

  const getStatusBadge = (status: string) => {
    if (status === "AKTIF") return "bg-emerald-100 text-emerald-700";
    if (status === "LULUS") return "bg-blue-100 text-blue-700";
    if (status === "PINDAH") return "bg-orange-100 text-orange-700";
    if (status === "CUTI") return "bg-gray-100 text-gray-700";
    return "bg-rose-100 text-rose-700";
  }

  // Handlers Delete
  // Handlers Export
  const handleExportExcel = async () => {
    if (data.activeTab !== "murid" && data.activeTab !== "alumni" && data.activeTab !== "sub-kelas") return
    setIsExporting(true)
    const unitName = schoolUnits.find((u: any) => u.id === activeUnitId)?.name || "SemuaUnit"
    const dateStr = new Date().toISOString().split('T')[0]

    try {
      const { exportToExcel } = await import("@/lib/excel")
      if (data.activeTab === "sub-kelas") {
        if (!data.classrooms || data.classrooms.length === 0) {
          toast.error("Tidak ada data rombel untuk diekspor")
          return
        }
        const mappedData = data.classrooms.map((c: any, index: number) => ({
          "No": index + 1,
          "Nama Rombel": c.name || "-",
          "Tingkat": c.tingkat?.name || "-",
          "Jurusan": c.jurusan?.name || "-",
          "Tahun Akademik": c.tahunAkademik?.name || "-",
          "Wali Kelas": c.waliKelas || "Belum ditentukan"
        }))
        const unitObjForKop = schoolUnits.find((u: any) => u.id === activeUnitId) || schoolUnits[0]
        exportToExcel(mappedData, `Rombel_${unitName}_${dateStr}`.replace(/\s+/g, '_'), {
          title: "Daftar Rombel / Kelas",
          unitInfo: unitObjForKop
        })
        toast.success("Berhasil mengekspor data rombel (Excel)")
        return
      }

      // Re-fetch data full length since students state is paginated
      const { getSiswaPaginated } = await import("@/actions/siswa")
      const res = await getSiswaPaginated({
        unitSekolahId: activeUnitId || schoolUnits[0]?.id || "",
        tahunAkademikId: activeYearId,
        tingkatId: data.filterMuridTingkat,
        jurusanId: data.filterMuridJurusan,
        subKelasId: data.filterMuridSubKelas,
        search: data.searchTerm,
        page: 1,
        limit: 9999,
        statusFilter: data.activeTab === "murid" ? "AKTIF" : data.filterAlumniStatus
      })

      if (res.data.length === 0) {
        toast.error("Tidak ada data untuk diekspor")
        return
      }

      const mappedData = res.data.map((m: any, index: number) => ({
        "No": index + 1,
        "NIS": m.nis,
        "NISN": m.nisn || "",
        "Nama Lengkap": m.name,
        "Jenis Kelamin": m.gender || "",
        "Rombel Saat Ini": m.riwayatKelas?.[0]?.subKelas?.name || "",
        "Status": m.status || "",
        "Tempat Lahir": m.birthPlace || "",
        "Tanggal Lahir": m.birthDate ? new Date(m.birthDate).toLocaleDateString('id-ID') : "",
        "Nama Ayah": m.fatherName || "",
        "Nama Ibu": m.motherName || "",
        "No Telepon Ortu": m.parentPhone || "",
        "Alamat": m.address || ""
      }))

      let filterTags = ""
      if (data.filterMuridTingkat) {
        const t = data.grades.find((g: any) => g.id === data.filterMuridTingkat)
        if (t) filterTags += `_Tkt-${t.name}`
      }
      if (data.filterMuridJurusan) {
        const j = initialMajors.find((m: any) => m.id === data.filterMuridJurusan)
        if (j) filterTags += `_Jrs-${j.name}`
      }
      if (data.filterMuridSubKelas) {
        const s = data.classrooms.find((c: any) => c.id === data.filterMuridSubKelas)
        if (s) filterTags += `_Rombel-${s.name}`
      }

      const statusName = data.activeTab === "murid" ? "Aktif" : (data.filterAlumniStatus || "SemuaStatus")
      const finalFileName = `Siswa_${unitName}_${statusName}${filterTags}_${dateStr}`.replace(/\s+/g, '_')

      const unitObjForKop = schoolUnits.find((u: any) => u.id === activeUnitId) || schoolUnits[0]
      exportToExcel(mappedData, finalFileName, {
        title: "Daftar Data Siswa",
        unitInfo: unitObjForKop
      })
      toast.success("Berhasil mengekspor data (Excel)")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mengekspor data Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (data.activeTab !== "murid" && data.activeTab !== "alumni" && data.activeTab !== "sub-kelas") return
    setIsExportingPDF(true)
    const dateStr = new Date().toISOString().split('T')[0]
    const activeTahunAkademikId = activeYearId || 'ALL'
    const activeTahunAkademik = academicYears.find((y: any) => y.id === activeYearId)

    try {
      const { exportTablePdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo, getSignatoryKiri } = await import("@/lib/pdf-helpers")
      const unitObj = activeUnitId === 'ALL' ? undefined : schoolUnits.find((u: any) => u.id === activeUnitId)

      if (data.activeTab === "sub-kelas") {
        if (!data.classrooms || data.classrooms.length === 0) {
          toast.error("Tidak ada data rombel untuk diekspor")
          return
        }
        const headers = ["No", "Nama Rombel", "Tingkat", "Jurusan", "Tahun Akademik", "Wali Kelas", "Jumlah Siswa"]
        const pdfRows = data.classrooms.map((c: any, index: number) => [
          index + 1,
          c.name || "-",
          c.tingkat?.name || "-",
          c.jurusan?.name || "-",
          c.tahunAkademik?.name || "-",
          c.waliKelas || "Belum ditentukan",
          c._count?.riwayatKelas ? `${c._count.riwayatKelas} Orang` : "0 Orang"
        ])
        exportTablePdf({
          institutionInfo: buildInstitutionInfo(pengaturan, unitObj),
          title: "Daftar Rekapitulasi Rombel",
          subtitle: `Tahun Akademik: ${activeTahunAkademikId === 'ALL' ? 'Semua' : activeTahunAkademik?.name} • Unit: ${unitObj?.name || "Semua Unit"}`,
          headers,
          data: pdfRows,
          filename: `Daftar_Rombel_${unitObj?.name || "Semua"}_${dateStr}`.replace(/\s+/g, '_'),
          config: { orientation: 'landscape' },
          penandatanganKiri: getSignatoryKiri(pengaturan, unitObj),
          penandatanganKanan: {
            jabatan: "Kepala Tata Usaha,",
            nama: unitObj?.namaKepalaTU || userName || "____________________"
          }
        })
      } else {
        const { getSiswaPaginated } = await import("@/actions/siswa")
        const res = await getSiswaPaginated({
          unitSekolahId: activeUnitId || schoolUnits[0]?.id || "",
          tahunAkademikId: activeYearId,
          tingkatId: data.filterMuridTingkat,
          jurusanId: data.filterMuridJurusan,
          subKelasId: data.filterMuridSubKelas,
          search: data.searchTerm,
          page: 1,
          limit: 9999,
          statusFilter: data.activeTab === "murid" ? "AKTIF" : data.filterAlumniStatus
        })

        if (res.data.length === 0) {
          toast.error("Tidak ada data murid untuk diekspor")
          return
        }

        const headers = ["No", "NIS", "NISN", "Nama Lengkap", "L/P", "Rombel", "Status", "No Telp Ortu"]
        const pdfRows = res.data.map((m: any, index: number) => [
          index + 1,
          m.nis || "-",
          m.nisn || "-",
          m.name || "-",
          m.gender === "Perempuan" ? "P" : "L",
          m.riwayatKelas?.[0]?.subKelas?.name || "-",
          m.status || "-",
          m.parentPhone || "-"
        ])

        const statusName = data.activeTab === "murid" ? "Aktif" : (data.filterAlumniStatus || "Semua Status")
        exportTablePdf({
          institutionInfo: buildInstitutionInfo(pengaturan, unitObj),
          title: `Daftar Murid (${statusName})`,
          subtitle: `Unit: ${unitObj?.name || "Semua Unit"} • Total: ${res.data.length} Siswa`,
          headers,
          data: pdfRows,
          filename: `Daftar_Murid_${unitObj?.name || "Semua"}_${statusName}_${dateStr}`.replace(/\s+/g, '_'),
          config: { orientation: 'landscape' },
          penandatanganKiri: getSignatoryKiri(pengaturan, unitObj),
          penandatanganKanan: {
            jabatan: "Petugas Kesiswaan,",
            nama: userName || "____________________"
          }
        })
      }
      toast.success("Berhasil mengekspor dokumen PDF resmi")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mengekspor dokumen PDF")
    } finally {
      setIsExportingPDF(false)
    }
  }


  const targetGrade = deleteData?.type === "tingkat" ? data.grades?.find((g: any) => g.id === deleteData.id) : null
  const targetClassroom = deleteData?.type === "subkelas" ? data.classrooms?.find((c: any) => c.id === deleteData.id) : null
  const targetStudent = deleteData?.type === "murid" ? data.students?.find((s: any) => s.id === deleteData.id) : null

  // Tingkat terkunci jika masih memiliki rombel aktif
  const isGradeLocked = Boolean(deleteData?.type === "tingkat" && targetGrade?._count?.subKelas && targetGrade._count.subKelas > 0)
  
  // Rombel terkunci jika masih memiliki siswa aktif
  const classroomStudentCount = targetClassroom?._count?.riwayatKelas || (targetClassroom as any)?._count?.murid || 0
  const isClassroomLocked = Boolean(deleteData?.type === "subkelas" && classroomStudentCount > 0)

  const isDeleteBlocked = isGradeLocked || isClassroomLocked

  const handleDeleteConfirm = async () => {
    if (!deleteData) return
    if (isDeleteBlocked) {
      setDeleteData(null)
      return
    }
    setIsDeleting(true)
    try {
      if (deleteData.type === "tingkat") {
        await hapusTingkatan(deleteData.id)
        data.setGrades(data.grades.filter((g: any) => g.id !== deleteData.id))
      } else if (deleteData.type === "subkelas") {
        await hapusKelas(deleteData.id)
        data.setClassrooms(data.classrooms.filter((c: any) => c.id !== deleteData.id))
      } else if (deleteData.type === "murid") {
        await hapusSiswa(deleteData.id)
        data.setStudents(data.students.filter((s: any) => s.id !== deleteData.id))
      }
      toast.success("Berhasil menghapus data")
      setDeleteData(null)
    } catch (e: any) {
      toast.error("Gagal menghapus data: " + e.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handlers Edit/Save
  const handleSaveMurid = async (formData: any) => {
    if (formData.nisn && formData.nisn.trim() !== "-" && formData.nisn.length !== 10) {
      toast.error("NISN harus 10 digit angka atau diisi '-' jika belum ada!")
      return
    }
    setIsSubmitting(true)
    try {
      if (formData.id) {
        const res = await editSiswa(formData.id, formData)
        data.setStudents(data.students.map((s: any) => s.id === formData.id ? res : s))
      } else {
        const res = await tambahSiswa({ ...formData, nis: formData.nis || formData.nisn || `NIS-${Date.now()}` })
        data.setStudents([{ ...res, riwayatKelas: [{ subKelasId: formData.subKelasId, subKelas: data.classrooms.find((c: any) => c.id === formData.subKelasId) }] }, ...data.students])
      }
      toast.success("Data murid berhasil disimpan")
      setShowModalMurid(false)
    } catch (err: any) { toast.error(err.message) }
    setIsSubmitting(false)
  }

  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formKelas.id) {
        const res = await editTingkatan(formKelas.id, { name: formKelas.name, order: Number(formKelas.order), unitSekolahId: formKelas.unitSekolahId })
        data.setGrades(data.grades.map((g: any) => g.id === formKelas.id ? { ...res, unitSekolah: schoolUnits.find((u: any) => u.id === formKelas.unitSekolahId) } : g).sort((a: any, b: any) => a.order - b.order))
        toast.success("Tingkat berhasil diperbarui")
      } else {
        const res = await tambahTingkatan({ ...formKelas, order: Number(formKelas.order) })
        data.setGrades([...data.grades, { ...res, unitSekolah: schoolUnits.find((u: any) => u.id === formKelas.unitSekolahId) }].sort((a: any, b: any) => a.order - b.order))
        toast.success("Tingkat berhasil ditambahkan")
      }
      setShowModalKelas(false)
      setFormKelas({ id: "", name: "", order: formKelas.order + 1, unitSekolahId: (activeUnitId && activeUnitId !== "all") ? activeUnitId : (schoolUnits[0]?.id || "") })
    } catch (err: any) { toast.error(err.message) }
    setIsSubmitting(false)
  }

  const handleSaveSubKelas = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formSubKelas.id) {
        const res = await editKelas(formSubKelas.id, formSubKelas)
        data.setClassrooms(data.classrooms.map((c: any) => c.id === formSubKelas.id ? { ...res, tingkat: data.grades.find((g: any) => g.id === formSubKelas.tingkatId) } : c))
      } else {
        const res = await tambahKelas(formSubKelas)
        data.setClassrooms([...data.classrooms, {
          ...res,
          tingkat: data.grades.find((g: any) => g.id === formSubKelas.tingkatId),
          _count: { murid: 0 }
        }])
      }
      toast.success("Sub kelas berhasil disimpan")
      setShowModalSubKelas(false)
      setFormSubKelas({ id: "", name: "", tingkatId: "", jurusanId: "", tahunAkademikId: activeYearId || academicYears[0]?.id || "", unitSekolahId: (activeUnitId && activeUnitId !== "all") ? activeUnitId : (schoolUnits[0]?.id || ""), waliKelasGuruId: "", waliKelas: "", waliKelasPhone: "" })
    } catch (err: any) { toast.error(err.message) }
    setIsSubmitting(false)
  }

  const TabButton = ({ id, label }: any) => {
    const isActive = data.activeTab === id
    return (
      <button
        onClick={() => data.setActiveTab(id)}
        className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main hover:border-border"}`}
      >
        {label}
      </button>
    )
  }

  return (
    <div>
      {/* Standardized Delete Warning / Confirmation Modal */}
      <DeleteWarningModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={isDeleteBlocked ? () => setDeleteData(null) : handleDeleteConfirm}
        isLoading={isDeleting}
        entityType={
          deleteData?.type === "subkelas" 
            ? "Rombel Kelas" 
            : deleteData?.type === "tingkat" 
            ? "Tingkatan Kelas" 
            : "Data Siswa"
        }
        entityName={
          deleteData?.type === "subkelas"
            ? `${targetClassroom?.tingkat?.name || ""} ${targetClassroom?.name || ""}`.trim()
            : deleteData?.type === "tingkat"
            ? targetGrade?.name || ""
            : `${targetStudent?.name || ""} (NISN: ${targetStudent?.nisn || "-"})`
        }
        unitName={
          deleteData?.type === "subkelas"
            ? targetClassroom?.unitSekolah?.name
            : deleteData?.type === "tingkat"
            ? targetGrade?.unitSekolah?.name
            : targetStudent?.unitSekolah?.name
        }
        isBlocked={isDeleteBlocked}
        dependencies={[
          ...(isClassroomLocked ? [{
            label: "Siswa Aktif Terdaftar",
            count: classroomStudentCount,
            icon: <Users size={14} className="text-rose-600" />,
            variant: "danger" as const
          }] : []),
          ...(isGradeLocked ? [{
            label: "Rombel Terhubung",
            count: targetGrade?._count?.subKelas || 0,
            icon: <Layers size={14} className="text-primary" />,
            variant: "warning" as const
          }] : [])
        ]}
        blockedTitle={
          isClassroomLocked 
            ? "Rombel Tidak Dapat Dihapus" 
            : "Tingkatan Tidak Dapat Dihapus"
        }
        blockedMessage={
          isClassroomLocked
            ? `Rombel "${targetClassroom?.name}" saat ini masih memiliki ${classroomStudentCount} siswa aktif di dalamnya.`
            : `Tingkatan "${targetGrade?.name}" masih terhubung dengan ${targetGrade?._count?.subKelas || 0} rombel aktif.`
        }
        blockedSolution={
          isClassroomLocked
            ? "Pindahkan seluruh siswa di rombel ini ke rombel kelas lain terlebih dahulu sebelum menghapus rombel."
            : "Pindahkan atau hapus seluruh rombel yang terdaftar di bawah tingkatan ini terlebih dahulu."
        }
        confirmTitle={
          deleteData?.type === "subkelas"
            ? "Hapus Rombel Kelas?"
            : deleteData?.type === "tingkat"
            ? "Hapus Tingkatan Kelas?"
            : "Hapus Data Siswa?"
        }
        confirmMessage={
          deleteData?.type === "subkelas"
            ? `Apakah Anda yakin ingin menghapus rombel "${targetClassroom?.name}"? Rombel ini sudah kosong (0 siswa) dan aman dihapus permanen.`
            : deleteData?.type === "tingkat"
            ? `Apakah Anda yakin ingin menghapus tingkatan "${targetGrade?.name}"? Data tingkatan yang kosong akan dihapus.`
            : `Apakah Anda yakin ingin menghapus data siswa "${targetStudent?.name}"? Data ini tidak dapat dikembalikan.`
        }
        confirmButtonText={
          deleteData?.type === "subkelas"
            ? "Hapus Rombel"
            : deleteData?.type === "tingkat"
            ? "Hapus Tingkatan"
            : "Hapus Siswa"
        }
      />

      <ConfirmModal
        isOpen={!!bulkActionConfirm}
        title={bulkActionConfirm?.type === 'lulus' ? 'Luluskan Siswa' : bulkActionConfirm?.type === 'pindah' ? 'Pindahkan Siswa (Mutasi/Keluar)' : 'Hapus Siswa Permanen'}
        message={bulkActionConfirm?.type === 'lulus' ? 'Yakin ingin meluluskan siswa terpilih? Mereka akan dipindahkan ke tab Alumni.' : bulkActionConfirm?.type === 'pindah' ? 'Yakin ingin menandai siswa terpilih sebagai Pindah/Keluar? Status mereka tidak akan aktif lagi.' : 'Yakin ingin menghapus secara permanen siswa terpilih? Data ini tidak dapat dikembalikan.'}
        onCancel={() => setBulkActionConfirm(null)}
        onConfirm={() => {
          if (bulkActionConfirm?.type === 'lulus') {
            data.handleBulkGraduation()
          } else if (bulkActionConfirm?.type === 'pindah') {
            data.handleBulkTransfer()
          } else {
            data.handleBulkDelete()
          }
          setBulkActionConfirm(null)
        }}
        isLoading={data.isPromoting}
      />

      {/* 4 Card KPI Kelas & Murid (Active for ALL Roles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-surface rounded-2xl p-3 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4 min-h-[76px] sm:min-h-[84px]">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">Total Siswa</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main leading-none">{new Intl.NumberFormat('id-ID').format(executiveMetrics.totalMuridInRombel)}</span>
            </div>
            <p className="text-[10px] font-medium text-text-muted mt-0.5 truncate">Rerata {executiveMetrics.avgPerRombel}/Kls</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4 min-h-[76px] sm:min-h-[84px]">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">Total Rombel</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main leading-none">{executiveMetrics.totalRombel}</span>
            </div>
            <p className="text-[10px] font-medium text-text-muted mt-0.5 truncate">Kelas & Rombel</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4 min-h-[76px] sm:min-h-[84px]">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <BarChart3 size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">Kepadatan Rombel</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main leading-none">{executiveMetrics.rombelIdeal}</span>
              <span className="text-[11px] font-bold text-emerald-600">Ideal</span>
            </div>
            <p className="text-[10px] font-semibold text-amber-600 mt-0.5 truncate">
              {executiveMetrics.rombelOvercapacity + executiveMetrics.rombelMinim} Anomali
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4 min-h-[76px] sm:min-h-[84px]">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">Penugasan Wali</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main leading-none">{executiveMetrics.rombelWithWali}</span>
              <span className="text-[11px] font-medium text-emerald-600">Terisi</span>
            </div>
            <p className="text-[10px] font-medium text-text-muted mt-0.5 truncate">dari {executiveMetrics.totalRombel} Rombel</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6">
        {/* Standardized Tab Navigation */}
        <TabNavigation
          tabs={isReadOnly ? [
            { id: "sub-kelas", label: "Kapasitas Rombel", shortLabel: "Rombel", icon: Users, badge: data.classrooms.length },
            { id: "murid", label: "Direktori Siswa", shortLabel: "Siswa", icon: GraduationCap },
            { id: "alumni", label: "Riwayat & Alumni", shortLabel: "Alumni", icon: BarChart3 },
            { id: "kelas", label: "Tingkat Pendidikan", shortLabel: "Tingkat", icon: Layers, badge: data.grades.length },
          ] : [
            { id: "kelas", label: "Tingkat (Kelas)", shortLabel: "Tingkat", icon: Layers, badge: data.grades.length },
            { id: "sub-kelas", label: "Rombel (Sub Kelas)", shortLabel: "Rombel", icon: Users, badge: data.classrooms.length },
            { id: "murid", label: "Murid Aktif", shortLabel: "Murid", icon: GraduationCap },
            { id: "alumni", label: "Riwayat & Alumni", shortLabel: "Alumni", icon: BarChart3 },
          ]}
          activeTab={data.activeTab}
          onChange={(id) => data.setActiveTab(id as any)}
        />

        {/* Toolbar */}
        <KelasToolbar
          {...data}
          initialMajors={initialMajors}
          schoolUnits={schoolUnits}
          activeUnitId={activeUnitId}
          activeYearId={activeYearId}
          academicYears={academicYears}
          handleExportExcel={handleExportExcel}
          isExporting={isExporting}
          handleExportPDF={handleExportPDF}
          isExportingPDF={isExportingPDF}
          setShowModalImportMurid={setShowModalImportMurid}
          setShowModalKelas={setShowModalKelas}
          setShowModalSubKelas={setShowModalSubKelas}
          setShowModalMurid={setShowModalMurid}
          setFormKelas={setFormKelas}
          setFormSubKelas={setFormSubKelas}
          setFormMurid={setFormMurid}
          isReadOnly={isReadOnly}
        />

        {/* Data Table / Centered Empty State */}
        {(() => {
          const isTabEmpty = 
            (data.activeTab === "kelas" && data.paginatedGrades.length === 0) ||
            (data.activeTab === "sub-kelas" && data.paginatedClassrooms.length === 0) ||
            ((data.activeTab === "murid" || data.activeTab === "alumni") && !data.isLoadingStudents && data.students.length === 0);

          if (isTabEmpty) {
            const emptyLabels: Record<string, { title: string, desc: string }> = {
              "kelas": { title: "Belum Ada Data Tingkat", desc: "Silakan gunakan tombol + Tambah Tingkat untuk membuat jenjang kelas baru." },
              "sub-kelas": { title: "Belum Ada Data Rombel", desc: "Silakan gunakan tombol + Tambah Rombel untuk membuat rombongan belajar baru." },
              "murid": { title: "Belum Ada Data Murid", desc: "Silakan gunakan tombol + Tambah Murid atau Impor Excel untuk memasukkan data siswa." },
              "alumni": { title: "Belum Ada Data Alumni", desc: "Data siswa yang telah lulus atau mutasi akan tercatat di tab ini." },
            };
            const info = emptyLabels[data.activeTab] || { title: "Belum Ada Data", desc: "Data belum tersedia pada kategori ini." };

            return (
              <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center text-text-muted w-full">
                <Users size={40} className="text-gray-300 mb-3 stroke-[1.5]" />
                <p className="font-bold text-text-main text-base mb-1">{info.title}</p>
                <p className="text-xs text-text-muted max-w-sm">{info.desc}</p>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                {data.activeTab === "kelas" && <TabKelas {...data} setDeleteData={setDeleteData} onEditTingkat={(g: any) => {
                  setFormKelas({ id: g.id, name: g.name, order: g.order, unitSekolahId: g.unitSekolahId })
                  setShowModalKelas(true)
                }} isReadOnly={isReadOnly} />}
                {data.activeTab === "sub-kelas" && <TabSubKelas {...data} setDeleteData={setDeleteData} setViewDetailSubKelas={setViewDetailSubKelas} setFormSubKelas={setFormSubKelas} setShowModalSubKelas={setShowModalSubKelas} isReadOnly={isReadOnly} />}
                {(data.activeTab === "murid" || data.activeTab === "alumni") && (
                  <TabMurid
                    {...data}
                    setDeleteData={setDeleteData}
                    setFormMurid={setFormMurid}
                    setShowModalMurid={setShowModalMurid}
                    setReactivateMurid={setReactivateMurid}
                    getStatusBadge={getStatusBadge}
                    isReadOnly={isReadOnly}
                  />
                )}
              </table>
            </div>
          );
        })()}

        {/* Pagination Controls */}
        {data.computedTotalPages > 0 && (
          <div className="p-4 mt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface rounded-b-2xl">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-muted">Tampilkan:</span>
              <select
                value={data.pageSize}
                onChange={(e) => {
                  data.setPageSize(Number(e.target.value))
                  data.setCurrentPage(1)
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
                onClick={() => data.setCurrentPage(p => Math.max(1, p - 1))}
                disabled={data.currentPage === 1}
                className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <span className="px-4 py-1.5 text-sm font-medium text-text-main">
                Hal {data.currentPage} dari {data.computedTotalPages}
              </span>
              <button
                onClick={() => data.setCurrentPage(p => Math.min(data.computedTotalPages, p + 1))}
                disabled={data.currentPage === data.computedTotalPages}
                className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar (Bulk Promote, Grad & Alumni Actions) */}
      {data.selectedStudents.length > 0 && (data.activeTab === "murid" || data.activeTab === "alumni") && !isReadOnly && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-6 left-1/2 -translate-x-1/2 bg-white/98 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.16)] border border-border px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-center gap-2 sm:gap-3 animate-in slide-in-from-bottom-6 fade-in duration-200 z-50 w-max max-w-[96vw] overflow-x-auto hide-scrollbar text-xs sm:text-sm">
          {/* Info Section */}
          <div className="flex items-center gap-2 font-semibold shrink-0">
            <span className="flex items-center justify-center bg-primary/10 text-primary w-5 h-5 rounded-full text-[10px]">{data.selectedStudents.length}</span>
            <span className="hidden sm:inline">{data.activeTab === "alumni" ? "Alumni" : "Siswa"}</span> Dipilih
          </div>

          <div className="h-6 w-px bg-border shrink-0"></div>

          {/* Action Group 1: Promote / Move / Reactivate to Classroom */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs font-medium w-28 sm:w-32 shrink-0"
              value={data.targetTahunAkademikId}
              onChange={(e) => data.setTargetTahunAkademikId(e.target.value)}
            >
              <option value="">Tahun Ajaran...</option>
              {academicYears.map((y: any) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>

            <select
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs font-medium w-32 sm:w-36 shrink-0"
              value={data.targetSubKelasId}
              onChange={(e) => data.setTargetSubKelasId(e.target.value)}
            >
              <option value="">Rombel Tujuan...</option>
              {data.targetClassrooms.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <Button size="sm" className="shrink-0 text-xs py-1.5 px-3 font-semibold" onClick={data.handleBulkPromote} disabled={!data.targetSubKelasId || !data.targetTahunAkademikId || data.isPromoting} isLoading={data.isPromoting}>
              {data.activeTab === "alumni" ? "Aktifkan ke Rombel" : "Naik Kelas / Mutasi"}
            </Button>
          </div>

          <div className="h-6 w-px bg-border shrink-0"></div>

          {/* Action Group 2: Danger Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {data.activeTab === "murid" && (
              <>
                <Button size="sm" variant="danger" className="text-xs py-1.5 px-3" onClick={() => setBulkActionConfirm({ type: 'lulus' })} disabled={data.isPromoting} isLoading={data.isPromoting}>
                  Luluskan
                </Button>

                <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs py-1.5 px-3 shrink-0" onClick={() => setBulkActionConfirm({ type: 'pindah' })} disabled={data.isPromoting} isLoading={data.isPromoting}>
                  Pindah
                </Button>
              </>
            )}

            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs py-1.5 px-3 shrink-0" onClick={() => setBulkActionConfirm({ type: 'hapus' })} disabled={data.isPromoting} isLoading={data.isPromoting}>
              Hapus
            </Button>

            <button onClick={() => data.setSelectedStudents([])} className="text-gray-400 hover:text-gray-600 p-1.5 ml-1 bg-gray-100 rounded-full shrink-0" title="Batal Pilihan">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambah Murid */}
      <MuridFormModal
        isOpen={showModalMurid}
        onClose={() => setShowModalMurid(false)}
        initialData={formMurid}
        onSave={handleSaveMurid}
        schoolUnits={schoolUnits}
        classrooms={data.classrooms}
        activeUnitId={activeUnitId}
      />

      {/* Modal Tambah Tingkat */}
      <TingkatFormModal
        isOpen={showModalKelas}
        onClose={() => setShowModalKelas(false)}
        formData={formKelas}
        setFormData={setFormKelas}
        onSave={handleSaveKelas}
        isSubmitting={isSubmitting}
        schoolUnits={schoolUnits}
        activeUnitId={activeUnitId}
      />

      {/* Modal Tambah Sub Kelas */}
      <SubKelasFormModal
        isOpen={showModalSubKelas}
        onClose={() => setShowModalSubKelas(false)}
        formData={formSubKelas}
        setFormData={setFormSubKelas}
        onSave={handleSaveSubKelas}
        isSubmitting={isSubmitting}
        schoolUnits={schoolUnits}
        grades={data.grades}
        academicYears={academicYears}
        initialMajors={initialMajors}
        initialTeachers={initialTeachers}
        activeUnitId={activeUnitId}
      />

      <ImportMuridModal
        isOpen={showModalImportMurid}
        onClose={() => setShowModalImportMurid(false)}
        onSuccess={() => {
          setShowModalImportMurid(false)
          // To trigger refresh, reset page and call refreshData
          data.setCurrentPage(1)
          data.refreshData()
          router.refresh()
        }}
        schoolUnits={schoolUnits}
        classrooms={data.classrooms}
        activeUnitId={activeUnitId}
      />

      {/* Drawer Detail Sub Kelas (Rombel) */}
      <SubKelasDetailDrawer
        isOpen={!!viewDetailSubKelas}
        onClose={() => setViewDetailSubKelas(null)}
        subKelas={viewDetailSubKelas}
        isReadOnly={isReadOnly}
        userName={userName}
        pengaturan={pengaturan}
        onManageClass={(sub) => {
          setViewDetailSubKelas(null)
          data.setActiveTab("murid")
          data.setFilterMuridSubKelas(sub.id)
        }}
        onEdit={(sub) => {
          setFormSubKelas({
            id: sub.id,
            name: sub.name,
            tingkatId: sub.tingkatId,
            jurusanId: sub.jurusanId || "",
            tahunAkademikId: sub.tahunAkademikId,
            unitSekolahId: sub.unitSekolahId,
            waliKelasGuruId: sub.waliKelasGuruId || "",
            waliKelas: sub.waliKelas || "",
            waliKelasPhone: sub.waliKelasPhone || ""
          })
          setShowModalSubKelas(true)
        }}
        onPrev={() => {
          if (!viewDetailSubKelas || !data.classrooms) return
          const idx = data.classrooms.findIndex((c: any) => c.id === viewDetailSubKelas.id)
          if (idx > 0) setViewDetailSubKelas(data.classrooms[idx - 1])
        }}
        onNext={() => {
          if (!viewDetailSubKelas || !data.classrooms) return
          const idx = data.classrooms.findIndex((c: any) => c.id === viewDetailSubKelas.id)
          if (idx !== -1 && idx < data.classrooms.length - 1) setViewDetailSubKelas(data.classrooms[idx + 1])
        }}
        prevDisabled={!viewDetailSubKelas || !data.classrooms || data.classrooms.findIndex((c: any) => c.id === viewDetailSubKelas.id) <= 0}
        nextDisabled={!viewDetailSubKelas || !data.classrooms || data.classrooms.findIndex((c: any) => c.id === viewDetailSubKelas.id) >= data.classrooms.length - 1 || data.classrooms.findIndex((c: any) => c.id === viewDetailSubKelas.id) === -1}
      />

      {/* Modal Reaktivasi Siswa */}
      <ReactivateSiswaModal
        isOpen={!!reactivateMurid}
        onClose={() => setReactivateMurid(null)}
        muridId={reactivateMurid?.id || null}
        muridName={reactivateMurid?.name || ""}
        academicYears={academicYears}
        classrooms={data.classrooms}
        onSuccess={() => {
          setReactivateMurid(null)
          data.refreshData()
          router.refresh()
        }}
      />

    </div>
  )
}

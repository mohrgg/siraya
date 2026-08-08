"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { 
  ArrowLeft, Share2, Printer, Edit2, User, Users, HeartPulse, 
  GraduationCap, MapPin, Award, CreditCard, Clock, FileText, 
  CheckCircle2, AlertCircle, Calendar, Building, DollarSign,
  FileSpreadsheet
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import MuridFormModal from "@/components/modals/MuridFormModal"
import { editSiswa } from "@/actions/siswa"
import PrintHeader from "@/components/shared/print/PrintHeader"

interface MuridDetailClientProps {
  initialMurid: any
  isReadOnly: boolean
  role: string
  schoolUnits: any[]
  classrooms: any[]
  pengaturan?: any
}

const PRIMARY_TABS = [
  { id: "biodata", label: "Biodata & Identitas", icon: User },
  { id: "keuangan", label: "Keuangan & SPP", icon: CreditCard },
  { id: "akademik", label: "Riwayat Kelas & Akademik", icon: GraduationCap },
  { id: "konseling", label: "Absensi & Konseling BK", icon: FileText },
]

const BIODATA_SUBTABS = [
  { id: "utama", label: "Informasi Utama", icon: GraduationCap },
  { id: "pribadi", label: "Identitas Pribadi", icon: User },
  { id: "keluarga", label: "Data Keluarga", icon: Users },
  { id: "pendidikan", label: "Pendidikan & Fisik", icon: MapPin },
  { id: "kesehatan", label: "Riwayat Kesehatan", icon: HeartPulse },
]

export default function MuridDetailClient({ 
  initialMurid, 
  isReadOnly, 
  role,
  schoolUnits,
  classrooms,
  pengaturan
}: MuridDetailClientProps) {
  const router = useRouter()
  const [murid, setMurid] = useState(initialMurid)
  const [activePrimaryTab, setActivePrimaryTab] = useState("biodata")
  const [activeBioTab, setActiveBioTab] = useState("utama")
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Tautan profil siswa berhasil disalin ke clipboard!")
    }
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const { exportToExcel } = await import("@/lib/excel")
      const dataToExport = [{
        "NISN": murid.nisn || "-",
        "NIS / NIK": murid.nis || "-",
        "Nama Lengkap": murid.name,
        "Unit Sekolah": murid.unitSekolah?.name || "-",
        "Rombel Saat Ini": murid.riwayatKelas?.[0]?.subKelas?.name || murid.subKelas?.name || "-",
        "Status": murid.status || "AKTIF",
        "Tempat, Tgl Lahir": `${murid.birthPlace || "-"}, ${murid.birthDate ? new Date(murid.birthDate).toLocaleDateString("id-ID") : "-"}`,
        "Jenis Kelamin": murid.gender,
        "Agama": murid.religion || "-",
        "Alamat": murid.address || "-",
        "Nama Orang Tua": murid.parentName || "-",
        "No. HP Orang Tua": murid.parentPhone || "-",
        "Asal Sekolah": murid.previousSchool || "-"
      }]
      const dateStr = new Date().toISOString().split('T')[0]
      exportToExcel(dataToExport, `Profil_Siswa_${murid.name}_${dateStr}`.replace(/\s+/g, '_'), {
        title: `Profil Detail Siswa: ${murid.name}`,
        unitInfo: murid.unitSekolah || { name: "Yayasan Siraya" }
      })
      toast.success("Berhasil mengunduh Excel Profil Siswa")
    } catch (err: any) {
      toast.error("Gagal ekspor Excel: " + err.message)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    try {
      const { exportTablePdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo } = await import("@/lib/pdf-helpers")
      
      const unitName = murid.unitSekolah?.name || "Unit Sekolah"
      const currentRombel = murid.riwayatKelas?.[0]?.subKelas?.name || murid.subKelas?.name || "Belum ada kelas"
      const dateStr = new Date().toISOString().split('T')[0]

      const headers = ["Keterangan / Field", "Informasi Siswa"]
      const pdfRows = [
        ["Nama Lengkap", murid.name],
        ["NISN / NIS", `${murid.nisn || "-"}/${murid.nis || "-"}`],
        ["Unit / Rombel", `${unitName} / ${currentRombel}`],
        ["Status Siswa", murid.status || "AKTIF"],
        ["Tempat, Tgl Lahir", `${murid.birthPlace || "-"}, ${murid.birthDate ? new Date(murid.birthDate).toLocaleDateString("id-ID") : "-"}`],
        ["Jenis Kelamin / Agama", `${murid.gender} / ${murid.religion || "-"}`],
        ["Alamat Tinggal", murid.address || "-"],
        ["Nama Orang Tua / Wali", murid.parentName || "-"],
        ["No. HP Orang Tua", murid.parentPhone || "-"],
        ["Asal Sekolah Sebelumnya", murid.previousSchool || "-"]
      ]

      exportTablePdf({
        institutionInfo: buildInstitutionInfo(pengaturan, murid.unitSekolah),
        title: `Data Profil Murid: ${murid.nama}`,
        subtitle: `Kelas: ${currentRombel} • Unit: ${unitName}`,
        headers,
        data: pdfRows,
        filename: `Data_Murid_${murid.nis}_${dateStr}`.replace(/\s+/g, '_'),
        config: { orientation: 'portrait' }
      })
      toast.success("Berhasil mengunduh PDF Profil Siswa")
    } catch (err: any) {
      toast.error("Gagal ekspor PDF: " + err.message)
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleSaveEdit = async (formData: any) => {
    setIsSubmitting(true)
    const toastId = toast.loading("Menyimpan pembaruan data siswa...")
    try {
      const res = await editSiswa(murid.id, formData)
      toast.success("Data siswa berhasil diperbarui!", { id: toastId })
      setMurid({ ...murid, ...formData, ...res })
      setShowEditModal(false)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Terjadi kesalahan sistem", { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === "AKTIF") return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (status === "LULUS") return "bg-blue-100 text-blue-800 border-blue-300";
    if (status === "PINDAH") return "bg-orange-100 text-orange-800 border-orange-300";
    if (status === "CUTI") return "bg-gray-100 text-gray-800 border-gray-300";
    return "bg-rose-100 text-rose-800 border-rose-300";
  }

  const currentRombel = murid.riwayatKelas?.[0]?.subKelas?.name || murid.subKelas?.name || "Belum ada kelas"
  const unitName = murid.unitSekolah?.name || "Unit Sekolah"
  const summaryKeuangan = murid.summaryKeuangan || { totalTagihan: 0, totalTerbayar: 0, sisaTunggakan: 0 }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6 print-content">
      {/* Kop Surat untuk Print Browser */}
      <PrintHeader unitInfo={murid.unitSekolah} pengaturan={pengaturan} />
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 print:hidden">
        <Button 
          variant="outline" 
          onClick={() => router.push("/kelas")}
          className="gap-2 self-start font-bold bg-white text-gray-700 hover:bg-gray-100"
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Kelas
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleCopyLink}
            className="gap-2 text-xs font-semibold bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
          >
            <Share2 size={15} /> Salin Tautan Profil
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="gap-1.5 text-xs font-semibold bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            <FileSpreadsheet size={15} /> Excel
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="gap-1.5 text-xs font-semibold bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <FileText size={15} /> PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="gap-2 text-xs font-semibold bg-white hover:bg-gray-100"
          >
            <Printer size={15} /> Cetak Profil
          </Button>
          {!isReadOnly && (
            <Button 
              variant="primary" 
              onClick={() => setShowEditModal(true)}
              className="gap-2 text-xs font-bold shadow-sm"
            >
              <Edit2 size={15} /> Edit Data Siswa
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 print:hidden">
        {/* 360° Hero Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 border-2 border-white/30 overflow-hidden flex items-center justify-center shadow-lg shrink-0 backdrop-blur-md">
              {murid.photoUrl ? (
                <img src={murid.photoUrl} alt={murid.name} className="w-full h-full object-cover" />
              ) : (
                <User size={44} className="text-white/80" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide bg-white/20 text-white border border-white/30">
                  {unitName}
                </span>
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide bg-amber-400 text-amber-950 shadow-xs">
                  Rombel: {currentRombel}
                </span>
                <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${getStatusBadge(murid.status)}`}>
                  {murid.status || "AKTIF"}
                </span>
                {murid.isScholarship && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide bg-purple-500 text-white flex items-center gap-1.5 shadow-xs">
                    <Award size={14} /> Penerima Beasiswa
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">{murid.name}</h1>
              <p className="text-sm sm:text-base text-blue-100 mt-1 font-mono">
                NIS: <span className="font-bold text-white">{murid.nis}</span> {murid.nisn ? `• NISN: ${murid.nisn}` : ""}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/20 self-stretch md:self-auto flex flex-col justify-center min-w-[200px]">
            <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Status Tunggakan SPP</div>
            <div className="text-xl sm:text-2xl font-black mt-0.5">
              {summaryKeuangan.sisaTunggakan === 0 ? (
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 size={20} /> Bebas Tunggakan
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1.5">
                  <AlertCircle size={20} /> {formatRupiah(summaryKeuangan.sisaTunggakan)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-1.5 shadow-xs flex items-center gap-2 overflow-x-auto print:hidden">
        {PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activePrimaryTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActivePrimaryTab(tab.id)}
              className={`flex items-center gap-2.5 py-3 px-5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex-1 justify-center ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content 1: BIODATA & IDENTITAS */}
      {activePrimaryTab === "biodata" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Sub-tab header for biodata */}
          <div className="flex border-b border-gray-200 px-6 gap-2 bg-gray-50/70 overflow-x-auto">
            {BIODATA_SUBTABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeBioTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveBioTab(tab.id)}
                  className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-primary text-primary bg-white shadow-xs rounded-t-lg"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-primary" : "text-gray-400"} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-6 sm:p-8 text-sm">
            {activeBioTab === "utama" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2 text-base flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary" /> Identitas Akademik
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Nomor Induk Siswa (NIS)</label>
                      <p className="font-mono font-bold text-gray-900 text-base mt-0.5">{murid.nis || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">NISN</label>
                      <p className="font-mono font-bold text-gray-900 text-base mt-0.5">{murid.nisn || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Unit Sekolah</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{unitName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Rombel Saat Ini</label>
                      <p className="font-bold text-primary mt-0.5">{currentRombel}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Status Siswa</label>
                      <p className="font-bold text-gray-800 mt-0.5">{murid.status || "AKTIF"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Penerima Beasiswa</label>
                      <p className="font-bold text-gray-800 mt-0.5">{murid.isScholarship ? "Ya (Aktif)" : "Tidak"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2 text-base flex items-center gap-2">
                    <User size={18} className="text-primary" /> Akun & Pendaftaran
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Username Akun</label>
                      <p className="font-mono font-bold text-gray-800 mt-0.5">{murid.username || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">No. Formulir / Daftar</label>
                      <p className="font-mono font-bold text-gray-800 mt-0.5">{murid.formNo || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Tanggal Terdaftar</label>
                      <p className="font-medium text-gray-700 mt-0.5">
                        {murid.createdAt ? new Date(murid.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeBioTab === "pribadi" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2 text-base flex items-center gap-2">
                    <User size={18} className="text-primary" /> Biodata Diri
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Nama Lengkap</label>
                      <p className="font-bold text-gray-900 text-base mt-0.5">{murid.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Nama Panggilan</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.nickname || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">NIK / No. KTP</label>
                      <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.nik || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Tempat Lahir</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.birthPlace || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Tanggal Lahir</label>
                      <p className="font-semibold text-gray-800 mt-0.5">
                        {murid.birthDate ? new Date(murid.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Jenis Kelamin</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.gender || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Agama</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.religion || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Anak Ke-</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.childOrder || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Jumlah Saudara</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.siblingCount || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2 text-base flex items-center gap-2">
                    <MapPin size={18} className="text-primary" /> Kontak & Alamat
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">No. Telepon / WhatsApp</label>
                      <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.phone || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Alamat Email</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.email || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Alamat Tempat Tinggal</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.address || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">RT / RW</label>
                      <p className="font-mono font-semibold text-gray-800 mt-0.5">
                        {murid.rt ? `${murid.rt} / ${murid.rw || "-"}` : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Kelurahan / Desa</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.village || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Kecamatan</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.district || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Kode Pos</label>
                      <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.postalCode || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeBioTab === "keluarga" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data Ayah */}
                  <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100 space-y-3">
                    <h3 className="font-extrabold text-blue-800 text-sm uppercase tracking-wider border-b border-blue-200 pb-2 flex items-center gap-2">
                      <User size={16} /> Data Ayah Kandung
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <label className="text-gray-400 font-semibold uppercase">Nama Lengkap Ayah</label>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">{murid.fatherName || "-"}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">NIK Ayah</label>
                        <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.fatherNik || "-"}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">Tahun Lahir</label>
                        <p className="font-semibold text-gray-800 mt-0.5">{murid.fatherBirthYear || "-"}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">Pendidikan Terakhir</label>
                        <p className="font-semibold text-gray-800 mt-0.5">{murid.fatherEducation || "-"}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">Pekerjaan</label>
                        <p className="font-semibold text-gray-800 mt-0.5">{murid.fatherOccupation || "-"}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-gray-400 font-semibold uppercase">Rentang Penghasilan</label>
                        <p className="font-semibold text-emerald-700 mt-0.5">{murid.fatherIncome || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Data Ibu */}
                  <div className="bg-pink-50/40 p-5 rounded-2xl border border-pink-100 space-y-3">
                    <h3 className="font-extrabold text-pink-700 text-sm uppercase tracking-wider border-b border-pink-200 pb-2 flex items-center gap-2">
                      <User size={16} /> Data Ibu Kandung
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <label className="text-gray-400 font-semibold uppercase">Nama Lengkap Ibu</label>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">{murid.motherName || "-"}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">NIK Ibu</label>
                        <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.motherNik || "-"}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">Tahun Lahir</label>
                        <p className="font-semibold text-gray-800 mt-0.5">{murid.motherBirthYear || "-"}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">Pendidikan Terakhir</label>
                        <p className="font-semibold text-gray-800 mt-0.5">{murid.motherEducation || "-"}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">Pekerjaan</label>
                        <p className="font-semibold text-gray-800 mt-0.5">{murid.motherOccupation || "-"}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-gray-400 font-semibold uppercase">Rentang Penghasilan</label>
                        <p className="font-semibold text-emerald-700 mt-0.5">{murid.motherIncome || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Wali & Kontak Darurat */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/80 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">
                      Data Wali (Jika Ada)
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <label className="text-gray-400 font-semibold uppercase">Nama Wali</label>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">{murid.guardianName || "-"}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">Pekerjaan Wali</label>
                        <p className="font-semibold text-gray-800 mt-0.5">{murid.guardianOccupation || "-"}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">No. Telepon Wali</label>
                        <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.guardianPhone || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">
                      Kontak Utama Orang Tua
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-gray-400 font-semibold uppercase">WhatsApp / No. HP Orang Tua</label>
                        <p className="font-mono font-black text-blue-700 text-lg mt-0.5 flex items-center gap-2">
                          {murid.parentPhone || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeBioTab === "pendidikan" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2 text-base flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary" /> Pendidikan Sebelumnya
                  </h3>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Nama Sekolah Asal (SMP/SD/TK)</label>
                      <p className="font-bold text-gray-800 text-base mt-1">{murid.previousSchool || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2 text-base flex items-center gap-2">
                    <HeartPulse size={18} className="text-primary" /> Data Periodik & Fisik
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Tinggi Badan</label>
                      <p className="font-bold text-gray-800 text-base mt-0.5">{murid.height ? `${murid.height} cm` : "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Berat Badan</label>
                      <p className="font-bold text-gray-800 text-base mt-0.5">{murid.weight ? `${murid.weight} kg` : "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Lingkar Kepala</label>
                      <p className="font-bold text-gray-800 text-base mt-0.5">{murid.headSize ? `${murid.headSize} cm` : "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Jarak ke Sekolah</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.distanceToSchool || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Waktu Tempuh</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.travelTime || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeBioTab === "kesehatan" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 space-y-4">
                  <h3 className="font-extrabold text-rose-800 text-base uppercase tracking-wide flex items-center gap-2">
                    <HeartPulse size={20} /> Data Medis & Kesehatan
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Golongan Darah</label>
                      <p className="font-black text-rose-600 text-3xl mt-1">{murid.bloodType || "-"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Riwayat Penyakit / Keluhan Kesehatan</label>
                      <p className="font-medium text-gray-800 mt-1 bg-white p-4 rounded-xl border border-rose-100 shadow-2xs">
                        {murid.medicalHistory || "Tidak ada riwayat penyakit atau keluhan kesehatan khusus yang dicatatkan."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: KEUANGAN & SPP */}
      {activePrimaryTab === "keuangan" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Financial Metrik Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CreditCard size={26} />
              </div>
              <div>
                <div className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">Total Akumulasi Tagihan</div>
                <div className="text-2xl font-black text-gray-900 mt-0.5">{formatRupiah(summaryKeuangan.totalTagihan)}</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <div className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">Total Sudah Dibayar</div>
                <div className="text-2xl font-black text-emerald-600 mt-0.5">{formatRupiah(summaryKeuangan.totalTerbayar)}</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold ${
                summaryKeuangan.sisaTunggakan === 0 ? "bg-gray-100 text-gray-500" : "bg-rose-50 text-rose-600"
              }`}>
                <AlertCircle size={26} />
              </div>
              <div>
                <div className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">Sisa Tunggakan Aktif</div>
                <div className={`text-2xl font-black mt-0.5 ${summaryKeuangan.sisaTunggakan === 0 ? "text-gray-500" : "text-rose-600"}`}>
                  {formatRupiah(summaryKeuangan.sisaTunggakan)}
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Daftar Tagihan & Riwayat Cicilan */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <DollarSign size={20} className="text-primary" /> Daftar Tagihan & Cicilan SPP Siswa
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Memuat riwayat penagihan bulanan maupun uang pangkal yang tercatat di modul Akuntansi & Keuangan.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                Total {murid.tagihan?.length || 0} Item Tagihan
              </span>
            </div>

            {!murid.tagihan || murid.tagihan.length === 0 ? (
              <div className="bg-gray-50/80 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center my-6">
                <CreditCard size={42} className="mx-auto text-gray-300 mb-2" />
                <div className="font-bold text-gray-700 text-base">Belum Ada Riwayat Tagihan SPP</div>
                <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                  Siswa ini belum memiliki tagihan SPP, Uang Pangkal, ataupun kewajiban keuangan lainnya yang di-generate dari Modul Tagihan Keuangan.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Jenis Tagihan</th>
                      <th className="py-3.5 px-5">Nominal Tagihan</th>
                      <th className="py-3.5 px-5">Terbayar</th>
                      <th className="py-3.5 px-5">Sisa / Tunggakan</th>
                      <th className="py-3.5 px-5">Jatuh Tempo</th>
                      <th className="py-3.5 px-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {murid.tagihan.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-5 font-bold text-gray-900">
                          {t.jenisTagihan?.name || "Tagihan Sekolah"}
                          <div className="text-[11px] text-gray-400 font-normal mt-0.5">ID: {t.id.slice(-8)}</div>
                        </td>
                        <td className="py-4 px-5 font-mono font-semibold text-gray-800">{formatRupiah(t.amount)}</td>
                        <td className="py-4 px-5 font-mono font-semibold text-emerald-600">{formatRupiah(t.totalPaid)}</td>
                        <td className="py-4 px-5 font-mono font-bold text-rose-600">{formatRupiah(t.remaining)}</td>
                        <td className="py-4 px-5 text-gray-600">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                            t.status === "PAID" ? "bg-emerald-100 text-emerald-800" :
                            t.status === "PARTIAL" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {t.status === "PAID" ? "Lunas" : t.status === "PARTIAL" ? "Nyicil" : "Belum Bayar"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 3: AKADEMIK & RIWAYAT KELAS */}
      {activePrimaryTab === "akademik" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <GraduationCap size={20} className="text-primary" /> Perjalanan & Riwayat Penempatan Rombel
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Jejak alokasi rombongan belajar dan kenaikan kelas siswa dari awal masuk hingga sekarang.</p>
            </div>
          </div>

          {!murid.riwayatKelas || murid.riwayatKelas.length === 0 ? (
            <div className="bg-gray-50/80 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center my-6">
              <Building size={42} className="mx-auto text-gray-300 mb-2" />
              <div className="font-bold text-gray-700 text-base">Belum Ada Riwayat Penempatan Rombel</div>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                Siswa ini belum dialokasikan ke kelas maupun rombongan belajar manapun pada tahun akademik aktif.
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Tahun Akademik</th>
                    <th className="py-3.5 px-5">Tingkat</th>
                    <th className="py-3.5 px-5">Sub Kelas (Rombel)</th>
                    <th className="py-3.5 px-5">Jurusan</th>
                    <th className="py-3.5 px-5 text-right">Tanggal Penempatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {murid.riwayatKelas.map((rk: any, i: number) => (
                    <tr key={rk.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-5 font-bold text-gray-900 flex items-center gap-2">
                        <Calendar size={15} className="text-primary" />
                        {rk.tahunAkademik?.year || "-"}
                        {i === 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-extrabold rounded-full">Aktif Saat Ini</span>}
                      </td>
                      <td className="py-4 px-5 font-semibold text-gray-700">{rk.subKelas?.tingkat?.name || "-"}</td>
                      <td className="py-4 px-5 font-black text-primary text-base">{rk.subKelas?.name || "-"}</td>
                      <td className="py-4 px-5 text-gray-600">{rk.subKelas?.jurusan?.name || "Umum"}</td>
                      <td className="py-4 px-5 text-right text-gray-500 text-xs font-mono">
                        {rk.createdAt ? new Date(rk.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: ABSENSI & KONSELING BK */}
      {activePrimaryTab === "konseling" && (
        <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 rounded-3xl border border-indigo-100 shadow-sm p-8 sm:p-12 text-center animate-in fade-in duration-200">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-indigo-500/20">
            <FileText size={38} />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900">Modul Absensi & Catatan Bimbingan Konseling (BK)</h3>
          <p className="text-sm text-gray-600 max-w-lg mx-auto mt-2 leading-relaxed">
            Halaman profil 360° ini telah disiapkan secara arsitektural untuk menampung grafik kehadiran siswa bulanan (Sakit, Izin, Alpa) serta rekam jejak pembinaan dan konseling oleh guru BK pada rilis modul berikutnya.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-100/80 text-indigo-800 rounded-full text-xs font-bold">
            <Clock size={15} /> Coming Soon: Fase Integrasi Kehadiran & BK
          </div>
        </div>
      )}
      </div>

      {/* ========================================================== */}
      {/* DEDICATED PRINT LAYOUT (BUKU INDUK SISWA 360°)             */}
      {/* ========================================================== */}
      <div className="hidden print:block space-y-6 text-black bg-white font-sans p-2">
        
        {/* KOP SURAT SEKOLAH */}
        <div className="border-b-2 border-black pb-3 text-center space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">YAYASAN AL-BASYARIAH / SIRAYA EDUCATION</h2>
          <h1 className="text-xl font-black uppercase tracking-wide text-black">UNIT {unitName} SIRAYA</h1>
          <p className="text-[11px] text-gray-700">Jl. Pendidikan Nusantara No. 123, Bandung, Jawa Barat • Telp: (022) 1234567 • Email: info@siraya.edu</p>
        </div>

        {/* JUDUL DOKUMEN */}
        <div className="text-center py-2 bg-gray-100 rounded border border-gray-300">
          <h2 className="text-base font-extrabold uppercase tracking-wide text-black">BUKU INDUK PESERTA DIDIK - PROFIL 360°</h2>
          <p className="text-xs font-mono text-gray-800 mt-0.5">NIS: {murid.nis || "-"} | NISN: {murid.nisn || "-"}</p>
        </div>

        {/* PAS FOTO & IDENTITAS SINGKAT */}
        <div className="flex items-start justify-between gap-6 border border-gray-300 p-4 rounded-lg">
          <div className="w-24 h-32 border-2 border-dashed border-gray-400 rounded flex flex-col items-center justify-center text-center p-1 bg-gray-50 shrink-0">
            {murid.photoUrl ? (
              <img src={murid.photoUrl} alt="Foto Siswa" className="w-full h-full object-cover rounded" />
            ) : (
              <span className="text-[10px] font-bold text-gray-500">PAS FOTO<br/>3 x 4 cm</span>
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div><span className="text-gray-500 font-semibold block">Nama Lengkap:</span><span className="font-bold text-sm text-black">{murid.name}</span></div>
            <div><span className="text-gray-500 font-semibold block">Rombel Saat Ini:</span><span className="font-bold text-sm text-black">{murid.riwayatKelas?.[0]?.subKelas?.name || "-"}</span></div>
            <div><span className="text-gray-500 font-semibold block">Jenis Kelamin:</span><span className="font-semibold">{murid.gender}</span></div>
            <div><span className="text-gray-500 font-semibold block">Status Siswa:</span><span className="font-semibold uppercase">{murid.status}</span></div>
            <div><span className="text-gray-500 font-semibold block">Tempat, Tanggal Lahir:</span><span className="font-semibold">{murid.birthPlace || "-"}, {murid.birthDate ? new Date(murid.birthDate).toLocaleDateString('id-ID') : "-"}</span></div>
            <div><span className="text-gray-500 font-semibold block">Agama:</span><span className="font-semibold uppercase">{murid.religion || "Islam"}</span></div>
          </div>
        </div>

        {/* BAGIAN 1: ALAMAT & KONTAK */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300 font-bold text-xs uppercase tracking-wider text-black">A. Alamat & Kontak Siswa</div>
          <div className="p-3 grid grid-cols-2 gap-2 text-xs">
            <div className="col-span-2"><span className="text-gray-500 block">Alamat Tinggal:</span><span className="font-semibold">{murid.address || "-"} (RT {murid.rt || "-"} / RW {murid.rw || "-"})</span></div>
            <div><span className="text-gray-500 block">Kelurahan / Desa:</span><span className="font-semibold">{murid.village || "-"}</span></div>
            <div><span className="text-gray-500 block">Kecamatan:</span><span className="font-semibold">{murid.district || "-"}</span></div>
            <div><span className="text-gray-500 block">No. Telepon / WhatsApp:</span><span className="font-mono font-semibold">{murid.phone || "-"}</span></div>
            <div><span className="text-gray-500 block">Alamat Email:</span><span className="font-semibold">{murid.email || "-"}</span></div>
          </div>
        </div>

        {/* BAGIAN 2: DATA ORANG TUA / WALI */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300 font-bold text-xs uppercase tracking-wider text-black">B. Data Orang Tua Kandung / Wali</div>
          <div className="p-3 grid grid-cols-2 gap-4 text-xs">
            <div className="border-r border-gray-200 pr-3 space-y-1">
              <div className="font-bold underline text-black">Data Ayah Kandung</div>
              <div><span className="text-gray-500">Nama:</span> <span className="font-semibold">{murid.fatherName || "-"}</span></div>
              <div><span className="text-gray-500">NIK:</span> <span className="font-mono">{murid.fatherNik || "-"}</span></div>
              <div><span className="text-gray-500">Pekerjaan:</span> <span>{murid.fatherOccupation || "-"}</span></div>
              <div><span className="text-gray-500">Pendidikan:</span> <span>{murid.fatherEducation || "-"}</span></div>
              <div><span className="text-gray-500">Penghasilan:</span> <span>{murid.fatherIncome || "-"}</span></div>
            </div>
            <div className="space-y-1">
              <div className="font-bold underline text-black">Data Ibu Kandung</div>
              <div><span className="text-gray-500">Nama:</span> <span className="font-semibold">{murid.motherName || "-"}</span></div>
              <div><span className="text-gray-500">NIK:</span> <span className="font-mono">{murid.motherNik || "-"}</span></div>
              <div><span className="text-gray-500">Pekerjaan:</span> <span>{murid.motherOccupation || "-"}</span></div>
              <div><span className="text-gray-500">Pendidikan:</span> <span>{murid.motherEducation || "-"}</span></div>
              <div><span className="text-gray-500">Penghasilan:</span> <span>{murid.motherIncome || "-"}</span></div>
            </div>
          </div>
          <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-300 text-xs">
            <span className="text-gray-600 font-semibold">No. Telepon / WhatsApp Orang Tua:</span> <span className="font-mono font-bold text-black">{murid.parentPhone || "-"}</span>
          </div>
        </div>

        {/* BAGIAN 3: RIWAYAT KELAS */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300 font-bold text-xs uppercase tracking-wider text-black">C. Riwayat Rombongan Belajar & Penempatan Kelas</div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300 font-bold">
                <th className="py-1.5 px-3 border-r border-gray-200">Tahun Ajaran</th>
                <th className="py-1.5 px-3 border-r border-gray-200">Tingkat</th>
                <th className="py-1.5 px-3 border-r border-gray-200">Rombel / Sub Kelas</th>
                <th className="py-1.5 px-3">Jurusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {murid.riwayatKelas && murid.riwayatKelas.length > 0 ? (
                murid.riwayatKelas.map((rk: any, i: number) => (
                  <tr key={rk.id || i}>
                    <td className="py-1.5 px-3 border-r border-gray-200 font-semibold">{rk.tahunAkademik?.year || "-"}</td>
                    <td className="py-1.5 px-3 border-r border-gray-200">{rk.subKelas?.tingkat?.name || "-"}</td>
                    <td className="py-1.5 px-3 border-r border-gray-200 font-bold text-black">{rk.subKelas?.name || "-"}</td>
                    <td className="py-1.5 px-3">{rk.subKelas?.jurusan?.name || "Umum"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="py-2 px-3 text-center text-gray-500 italic">Belum ada riwayat kelas</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BAGIAN 4: RINGKASAN STATUS KEUANGAN */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300 font-bold text-xs uppercase tracking-wider text-black">D. Ringkasan SPP & Administrasi Keuangan</div>
          <div className="p-3 grid grid-cols-3 gap-4 text-center text-xs">
            <div className="border border-gray-200 p-2 rounded bg-gray-50">
              <span className="text-gray-500 block">Total Tagihan:</span>
              <span className="font-mono font-bold text-sm text-black">{formatRupiah(summaryKeuangan.totalTagihan)}</span>
            </div>
            <div className="border border-gray-200 p-2 rounded bg-gray-50">
              <span className="text-gray-500 block">Total Terbayar:</span>
              <span className="font-mono font-bold text-sm text-emerald-700">{formatRupiah(summaryKeuangan.totalTerbayar)}</span>
            </div>
            <div className="border border-gray-200 p-2 rounded bg-gray-50">
              <span className="text-gray-500 block">Sisa Tunggakan:</span>
              <span className={`font-mono font-bold text-sm ${summaryKeuangan.sisaTunggakan > 0 ? "text-red-600" : "text-black"}`}>{formatRupiah(summaryKeuangan.sisaTunggakan)}</span>
            </div>
          </div>
        </div>

        {/* TANDA TANGAN & PENGESAHAN */}
        <div className="pt-8 flex items-start justify-between text-center text-xs break-inside-avoid">
          <div className="w-56 space-y-12">
            <p className="text-gray-600">Mengetahui,<br/>Orang Tua / Wali Siswa</p>
            <p className="font-bold underline text-black">( ........................................ )</p>
          </div>
          <div className="w-56 space-y-12">
            <p className="text-gray-600">Bandung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Kepala Sekolah / Wali Kelas</p>
            <p className="font-bold underline text-black">( ........................................ )</p>
          </div>
        </div>

      </div>

      {/* Modal Edit Form (Untuk Admin & TU) */}
      {!isReadOnly && (
        <MuridFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
          initialData={murid}
          schoolUnits={schoolUnits}
          classrooms={classrooms}
        />
      )}

    </div>
  )
}

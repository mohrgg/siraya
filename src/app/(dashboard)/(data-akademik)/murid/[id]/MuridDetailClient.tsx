"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { 
  ArrowLeft, Share2, Printer, Edit2, User, Users, HeartPulse, 
  GraduationCap, MapPin, Award, CreditCard, Clock, FileText, 
  CheckCircle2, AlertCircle, Calendar, Building, DollarSign,
  FileSpreadsheet, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ToolbarExportExcel, ToolbarExportPDF } from "@/components/ui/DataTableToolbar"
import MuridFormModal from "@/components/modals/MuridFormModal"
import { editSiswa } from "@/actions/siswa"
import PrintHeader from "@/components/shared/print/PrintHeader"
import PrintSignature from "@/components/shared/print/PrintSignature"
import PrintFooter from "@/components/shared/print/PrintFooter"
import { getRiwayatTransaksiByTagihan } from "@/actions/pembayaran-tagihan"
import { exportResiPdf } from "@/lib/pdf"

interface MuridDetailClientProps {
  initialMurid: any
  isReadOnly: boolean
  role: string
  schoolUnits: any[]
  classrooms: any[]
  pengaturan?: any
  userName?: string
}

const PRIMARY_TABS = [
  { id: "biodata", label: "Biodata & Identitas", icon: User },
  { id: "akademik", label: "Riwayat Kelas & Akademik", icon: GraduationCap },
  { id: "konseling", label: "Absensi & Konseling BK", icon: FileText },
  { id: "keuangan", label: "Keuangan & SPP", icon: CreditCard },
]

const BIODATA_SUBTABS = [
  { id: "pribadi", label: "Identitas Pribadi", icon: User },
  { id: "keluarga", label: "Keluarga & Wali", icon: Users },
  { id: "fisik_medis", label: "Fisik & Medis", icon: HeartPulse },
  { id: "sistem", label: "Registrasi & Sistem", icon: Building },
]

export default function MuridDetailClient({ 
  initialMurid, 
  isReadOnly, 
  role,
  schoolUnits,
  classrooms,
  pengaturan,
  userName
}: MuridDetailClientProps) {
  const router = useRouter()
  const [murid, setMurid] = useState(initialMurid)
  const [activePrimaryTab, setActivePrimaryTab] = useState("biodata")
  const [activeBioTab, setActiveBioTab] = useState("pribadi")
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isPrintingTagihan, setIsPrintingTagihan] = useState<string | null>(null)

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
        "Nama Orang Tua": murid.fatherName || murid.motherName || murid.guardianName || "-",
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
        ["Nama Orang Tua / Wali", murid.fatherName || murid.motherName || murid.guardianName || "-"],
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

  const handleDirectPrintTagihan = async (t: any) => {
    setIsPrintingTagihan(t.id)
    try {
      const { buildInstitutionInfo } = await import("@/lib/pdf-helpers")
      const institutionInfo = buildInstitutionInfo(pengaturan, murid.unitSekolah)

      if (t.status === "BELUM_BAYAR") {
        await exportResiPdf({
          institutionInfo,
          title: "SURAT TAGIHAN SPP / BIAYA",
          noReferensi: `TAG-${t.id.slice(-6).toUpperCase()}`,
          tanggal: new Date(),
          penerimaDari: murid.name,
          items: [{ keterangan: t.akun?.nama || "Tagihan", nominal: t.jumlah }],
          total: t.jumlah,
          catatan: "Mohon segera melunasi tagihan ini sebelum tanggal jatuh tempo.",
          penandatanganKanan: { jabatan: "Tata Usaha", nama: userName || "Admin" },
          filename: `Tagihan_${murid.name}_${t.akun?.nama}`
        })
        toast.success("Surat Tagihan berhasil diunduh")
      } else {
        const riwayat = await getRiwayatTransaksiByTagihan(t.id)
        if (!riwayat || riwayat.length === 0) {
          toast.error("Riwayat pembayaran tidak ditemukan")
          return
        }
        const dataResi = riwayat[0]
        
        await exportResiPdf({
          institutionInfo,
          noReferensi: dataResi.noReferensi,
          tanggal: dataResi.tanggal,
          penerimaDari: dataResi.muridName,
          items: dataResi.items.map((item: any) => ({
            keterangan: item.namaAkun,
            nominal: item.jumlahBayar
          })),
          total: dataResi.total,
          catatan: pengaturan?.catatanKwitansi,
          penandatanganKanan: { jabatan: "Bendahara Penerima", nama: userName || pengaturan?.namaBendahara || "Staf Keuangan" },
          filename: `Kwitansi_${dataResi.noReferensi}`
        })
        toast.success("Bukti Pembayaran berhasil diunduh")
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal mencetak dokumen")
    } finally {
      setIsPrintingTagihan(null)
    }
  }

  return (
    <div className="space-y-6 print-content">
      
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
          <ToolbarExportExcel 
            onClick={handleExportExcel}
            disabled={isExportingExcel}
          />
          <ToolbarExportPDF 
            onClick={handleExportPDF}
            disabled={isExportingPDF}
          />
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
        {/* Minimalist Profile Header */}
        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative overflow-hidden">
          {/* Subtle decorative background */}
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            {/* Initial Avatar */}
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-black shadow-sm shrink-0 border ${
              murid.gender === 'Perempuan' 
                ? 'bg-gradient-to-br from-rose-100 to-pink-50 text-rose-600 border-rose-200/50' 
                : 'bg-gradient-to-br from-blue-100 to-indigo-50 text-blue-600 border-blue-200/50'
            }`}>
              {murid.name.charAt(0).toUpperCase()}
            </div>

            {/* Identity Details */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-border">
                  {unitName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Rombel: {currentRombel}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(murid.status)}`}>
                  {murid.status || "AKTIF"}
                </span>
                {murid.isScholarship && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <Award size={12} /> Penerima Beasiswa
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight mb-1">
                {murid.name}
              </h1>
              <div className="flex items-center gap-1.5 text-sm text-text-muted font-medium flex-wrap mt-1">
                <User size={16} />
                <span>NIS: <span className="font-mono text-text-main font-semibold ml-1">{murid.nis || "-"}</span></span>
                {murid.nisn && (
                  <>
                    <span className="mx-1 text-border">•</span>
                    <span>NISN: <span className="font-mono text-text-main font-semibold ml-1">{murid.nisn}</span></span>
                  </>
                )}
                <span className="mx-1 text-border">•</span>
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  ID Sistem: <span className="font-mono font-bold tracking-tight">{murid.id}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="flex gap-4 relative z-10 self-stretch md:self-auto min-w-[200px]">
            <div className="bg-gray-50 border border-border rounded-xl p-4 shadow-sm w-full flex flex-col justify-center">
              <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Status Tunggakan SPP</div>
              <div className="text-lg font-black mt-0.5">
                {summaryKeuangan.sisaTunggakan === 0 ? (
                  <span className="text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 size={20} /> Bebas Tunggakan
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-2">
                    <AlertCircle size={20} /> {formatRupiah(summaryKeuangan.sisaTunggakan)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modular Tab Navigation */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="flex border-b border-border overflow-x-auto hide-scrollbar">
            {PRIMARY_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activePrimaryTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePrimaryTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap flex-1 ${
                    isActive 
                      ? "border-b-2 border-primary text-primary bg-primary/5" 
                      : "text-text-muted hover:text-text-main hover:bg-gray-50"
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
        <div className="animate-in fade-in duration-200">
          {/* Sub-tab header for biodata */}
          <div className="flex border-b border-border px-6 gap-2 bg-gray-50/70 overflow-x-auto">
            {BIODATA_SUBTABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeBioTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveBioTab(tab.id)}
                  className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-primary text-primary bg-surface shadow-sm rounded-t-lg"
                      : "border-transparent text-text-muted hover:text-text-main hover:border-border"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-primary" : "text-gray-400"} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-6 sm:p-8 text-sm">
            {activeBioTab === "pribadi" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2 text-base flex items-center gap-2">
                    <User size={18} className="text-primary" /> Biodata Diri
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
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

            {activeBioTab === "fisik_medis" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2 text-base flex items-center gap-2">
                    <HeartPulse size={18} className="text-primary" /> Data Periodik & Fisik
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
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
                      <label className="text-xs text-gray-400 font-semibold uppercase">Golongan Darah</label>
                      <p className="font-bold text-gray-800 text-base mt-0.5">{murid.bloodType || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Jarak ke Sekolah</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.distanceToSchool || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Waktu Tempuh</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.travelTime || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-extrabold text-rose-800 border-b border-rose-200 pb-2 text-base flex items-center gap-2">
                    <AlertCircle size={18} className="text-rose-600" /> Riwayat Medis Khusus
                  </h3>
                  <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-xs text-rose-500 font-semibold uppercase">Penyakit Bawaan / Kronis</label>
                        <p className="font-bold text-rose-950 text-base mt-0.5">{murid.disease || "Tidak ada riwayat penyakit"}</p>
                      </div>
                      <div>
                        <label className="text-xs text-rose-500 font-semibold uppercase">Kelainan Fisik / Disabilitas</label>
                        <p className="font-semibold text-rose-900 mt-0.5">{murid.abnormality || "Tidak ada kelainan fisik"}</p>
                      </div>
                      <div>
                        <label className="text-xs text-rose-500 font-semibold uppercase">Catatan Tambahan Medis</label>
                        <p className="font-medium text-rose-800 mt-0.5">{murid.medicalHistory || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeBioTab === "sistem" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2 text-base flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary" /> Identitas Akademik Sekolah
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
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
                    <div className="col-span-2 border-t border-gray-200 pt-3 mt-1">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Asal Sekolah Sebelumnya (SD/SMP)</label>
                      <p className="font-bold text-gray-800 text-base mt-0.5">{murid.previousSchool || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2 text-base flex items-center gap-2">
                    <Building size={18} className="text-primary" /> Registrasi & Pendaftaran
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Username Akun Portal</label>
                      <p className="font-mono font-bold text-gray-800 mt-0.5">{murid.username || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">No. Formulir / Daftar</label>
                      <p className="font-mono font-bold text-gray-800 mt-0.5">{murid.formNo || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Status Siswa</label>
                      <p className="font-bold text-gray-800 mt-0.5">{murid.status || "AKTIF"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Penerima Beasiswa Khusus</label>
                      <p className="font-bold text-gray-800 mt-0.5">{murid.isScholarship ? "Ya (Aktif)" : "Tidak"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Tanggal Terdaftar Masuk</label>
                      <p className="font-medium text-gray-700 mt-0.5">
                        {murid.createdAt ? new Date(murid.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Tab Content 2: AKADEMIK & RIWAYAT KELAS */}
      {activePrimaryTab === "akademik" && (
        <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
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

      {/* Tab Content 3: ABSENSI & KONSELING BK */}
      {activePrimaryTab === "konseling" && (
        <div className="p-8 sm:p-12 text-center animate-in fade-in duration-200">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-indigo-500/20">
            <FileText size={38} />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-text-main">Modul Absensi & Catatan Bimbingan Konseling (BK)</h3>
          <p className="text-sm text-text-muted max-w-lg mx-auto mt-2 leading-relaxed">
            Halaman profil 360° ini telah disiapkan secara arsitektural untuk menampung grafik kehadiran siswa bulanan (Sakit, Izin, Alpa) serta rekam jejak pembinaan dan konseling oleh guru BK pada rilis modul berikutnya.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
            <Clock size={15} /> Coming Soon: Fase Integrasi Kehadiran & BK
          </div>
        </div>
      )}

      {/* Tab Content 4: KEUANGAN & PEMBAYARAN */}
      {activePrimaryTab === "keuangan" && (
        <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
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
                {summaryKeuangan.sisaTunggakan === 0 ? <CheckCircle2 size={26} /> : <AlertCircle size={26} />}
              </div>
              <div>
                <div className={`text-xs font-extrabold uppercase tracking-wide ${
                  summaryKeuangan.sisaTunggakan === 0 ? "text-gray-400" : "text-rose-400"
                }`}>Sisa Tunggakan SPP</div>
                <div className={`text-2xl font-black mt-0.5 ${
                  summaryKeuangan.sisaTunggakan === 0 ? "text-gray-900" : "text-rose-600"
                }`}>
                  {formatRupiah(summaryKeuangan.sisaTunggakan)}
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Riwayat Tagihan */}
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <DollarSign size={20} className="text-primary" /> Rincian Tagihan & Kewajiban
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Seluruh tagihan yang tercatat atas nama siswa ini pada tahun akademik berjalan.</p>
              </div>
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
                      <th className="py-3.5 px-5 text-right w-32">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {murid.tagihan.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-5 font-bold text-gray-900">
                          {t.akun?.nama || "Tagihan Sekolah"}
                          <div className="text-[11px] text-gray-400 font-normal mt-0.5">ID: {t.id.slice(-8)}</div>
                        </td>
                        <td className="py-4 px-5 font-mono font-semibold text-gray-800">{formatRupiah(t.jumlah)}</td>
                        <td className="py-4 px-5 font-mono font-semibold text-emerald-600">{formatRupiah(t.jumlah - t.sisaTagihan)}</td>
                        <td className="py-4 px-5 font-mono font-bold text-rose-600">{formatRupiah(t.sisaTagihan)}</td>
                        <td className="py-4 px-5 text-gray-600">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                            t.status === "LUNAS" ? "bg-emerald-100 text-emerald-800" :
                            t.status === "SEBAGIAN" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {t.status === "LUNAS" ? "Lunas" : t.status === "SEBAGIAN" ? "Nyicil" : "Belum Bayar"}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 text-xs font-semibold px-3"
                            onClick={() => handleDirectPrintTagihan(t)}
                            disabled={isPrintingTagihan === t.id}
                          >
                            {isPrintingTagihan === t.id ? (
                              <Loader2 size={14} className="animate-spin text-gray-500" />
                            ) : (
                              <Printer size={14} className="mr-1.5 opacity-70" />
                            )}
                            {t.status === "BELUM_BAYAR" ? "Cetak Tagihan" : "Cetak Resi"}
                          </Button>
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

      </div>
      </div>

      {/* ========================================================== */}
      {/* DEDICATED PRINT LAYOUT (BUKU INDUK SISWA 360°)             */}
      {/* ========================================================== */}
      <div className="hidden print:block space-y-6 text-black bg-white font-sans p-2">
        
        {/* KOP SURAT SEKOLAH (Standar via PrintHeader) */}
        <PrintHeader unitInfo={murid.unitSekolah} pengaturan={pengaturan} className="block" />

        {/* JUDUL DOKUMEN */}
        <div className="text-center py-2 bg-gray-100 rounded border border-gray-300">
          <h2 className="text-base font-extrabold uppercase tracking-wide text-black">BUKU INDUK PESERTA DIDIK - PROFIL 360°</h2>
          <p className="text-xs font-mono text-gray-800 mt-0.5">NIS: {murid.nis || "-"} | NISN: {murid.nisn || "-"}</p>
        </div>

        {/* IDENTITAS SINGKAT */}
        <div className="border border-gray-300 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
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
        <PrintSignature
          pengaturan={pengaturan}
          unitInfo={murid.unitSekolah}
          tipe="ganda"
          tanggal={new Date()}
          kiri={{ jabatan: "Mengetahui,", nama: "Orang Tua / Wali Siswa" }}
          kanan={{ jabatan: "Wali Kelas / Kepala Sekolah,", nama: pengaturan?.namaKepalaTU || "____________________" }}
          className="flex"
        />
        <PrintFooter pengaturan={pengaturan} className="block" />

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

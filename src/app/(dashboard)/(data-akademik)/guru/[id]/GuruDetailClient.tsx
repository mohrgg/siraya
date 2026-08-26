"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Building2, 
  Phone, 
  Mail, 
  Link as LinkIcon, 
  Edit2, 
  CreditCard,
  Briefcase,
  BookOpen,
  MessageCircle,
  Share2,
  FileSpreadsheet,
  FileText,
  Printer
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import PrintHeader from "@/components/shared/print/PrintHeader"
import PrintSignature from "@/components/shared/print/PrintSignature"
import PrintFooter from "@/components/shared/print/PrintFooter"
import GuruFormModal from "@/components/modals/GuruFormModal"
import { editGuru } from "@/actions/guru"

// Types based on the Prisma schema
type Rombel = {
  id: string;
  name: string;
}

type GuruData = {
  id: string
  nip: string | null
  name: string
  gender: string
  phone: string | null
  email: string | null
  statusKepegawaian: string
  pendidikan: string | null
  bidangStudiId: string | null
  bidangStudi: { id: string, name: string } | null
  bankName: string | null
  bankAccount: string | null
  bankAccountName: string | null
  isActive: boolean
  unitSekolah: { id: string; name: string; namaKepalaSekolah?: string | null }
  rombelWali: Rombel[]
}

export default function GuruDetailClient({ initialData, isReadOnly = false, pengaturan, userName, schoolUnits = [] }: { initialData: GuruData, isReadOnly?: boolean, pengaturan?: any, userName?: string, schoolUnits?: any[] }) {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"profil" | "keuangan" | "rombel">("profil")
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleSaveModal = async (formData: any) => {
    try {
      await editGuru(formData.id, formData)
      toast.success("Berhasil mengubah data guru")
      setIsEditing(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah data")
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Tautan profil guru disalin!")
  }

  const formatWhatsAppUrl = (phone: string | null) => {
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('0')) return `https://wa.me/62${cleaned.substring(1)}`
    if (cleaned.startsWith('62')) return `https://wa.me/${cleaned}`
    return `https://wa.me/62${cleaned}`
  }

  const waUrl = formatWhatsAppUrl(initialData.phone)

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
        "NIP / NIK": initialData.nip || "-",
        "Nama Lengkap": initialData.name,
        "Unit Sekolah": initialData.unitSekolah?.name || "-",
        "Jenis Kelamin": initialData.gender,
        "Status Kepegawaian": initialData.statusKepegawaian,
        "Pendidikan Terakhir": initialData.pendidikan || "-",
        "Bidang Studi": initialData.bidangStudi?.name || "-",
        "No. HP / WA": initialData.phone || "-",
        "Email": initialData.email || "-",
        "Bank": initialData.bankName || "-",
        "No. Rekening": initialData.bankAccount || "-",
        "Atas Nama": initialData.bankAccountName || "-",
        "Wali Kelas": initialData.rombelWali?.map(r => r.name).join(", ") || "-"
      }]
      const dateStr = new Date().toISOString().split('T')[0]
      exportToExcel(dataToExport, `Profil_Guru_${initialData.name}_${dateStr}`.replace(/\s+/g, '_'), {
        title: `Profil Guru: ${initialData.name}`,
        unitInfo: initialData.unitSekolah || { name: pengaturan?.namaYayasan || "Yayasan Siraya" }
      })
      toast.success("Berhasil mengunduh Excel Profil Guru")
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
      const dateStr = new Date().toISOString().split('T')[0]
      const headers = ["Keterangan / Field", "Informasi Guru"]
      const pdfRows = [
        ["Nama Lengkap", initialData.name],
        ["NIP / NIK", initialData.nip || "-"],
        ["Unit Sekolah", initialData.unitSekolah?.name || "-"],
        ["Jenis Kelamin", initialData.gender],
        ["Status Kepegawaian", initialData.statusKepegawaian],
        ["Pendidikan Terakhir", initialData.pendidikan || "-"],
        ["Bidang Studi", initialData.bidangStudi?.name || "-"],
        ["No. HP / WA", initialData.phone || "-"],
        ["Email", initialData.email || "-"],
        ["Bank / Rekening", `${initialData.bankName || "-"} / ${initialData.bankAccount || "-"}`],
        ["Wali Kelas", initialData.rombelWali?.map(r => r.name).join(", ") || "-"]
      ]
      exportTablePdf({
        institutionInfo: buildInstitutionInfo(pengaturan, initialData.unitSekolah),
        title: `Profil Guru - ${initialData.name}`,
        subtitle: `NIP: ${initialData.nip || "-"} • Unit: ${initialData.unitSekolah?.name || "-"}`,
        headers,
        data: pdfRows,
        filename: `Profil_Guru_${initialData.name}_${dateStr}`.replace(/\s+/g, '_'),
        config: { orientation: 'portrait' }
      })
      toast.success("Berhasil mengunduh PDF Profil Guru")
    } catch (err: any) {
      toast.error("Gagal ekspor PDF: " + err.message)
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <>
    <div className="space-y-6 print-content animate-in fade-in duration-500">
      {/* Kop Surat untuk Print Browser */}
      <PrintHeader unitInfo={initialData.unitSekolah} pengaturan={pengaturan} />
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 print:hidden">
        <Button 
          variant="outline" 
          onClick={() => router.push("/guru")}
          className="gap-2 self-start font-bold bg-white text-gray-700 hover:bg-gray-100"
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Guru
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
            <FileSpreadsheet size={15} /> {isExportingExcel ? "Mengunduh..." : "Excel"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="gap-1.5 text-xs font-semibold bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <FileText size={15} /> {isExportingPDF ? "Mengunduh..." : "PDF"}
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
              className="gap-2 text-xs font-bold shadow-sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={15} /> Edit Data Guru
            </Button>
          )}
        </div>
      </div>

      {/* Minimalist Profile Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        
        <div className="flex items-center gap-5 relative z-10">
          {/* Initial Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-700 border border-emerald-200/50 flex items-center justify-center text-3xl font-black shadow-sm shrink-0">
            {initialData.name.charAt(0).toUpperCase()}
          </div>

          {/* Identity Details */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                initialData.statusKepegawaian === "GTY" ? "bg-emerald-100 text-emerald-700" :
                initialData.statusKepegawaian === "PNS" ? "bg-purple-100 text-purple-700" :
                "bg-blue-100 text-blue-700"
              } border border-black/5`}>
                {initialData.statusKepegawaian}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-border">
                {initialData.unitSekolah.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight mb-1">
              {initialData.name}
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-text-muted font-medium">
              <Briefcase size={16} />
              <span>NIP/NIK: <span className="font-mono text-text-main font-semibold ml-1">{initialData.nip || "-"}</span></span>
            </div>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="flex gap-4 relative z-10">
          <div className="bg-gray-50 border border-border rounded-xl p-4 shadow-sm min-w-[130px]">
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Status</div>
            <div className="text-lg font-black text-emerald-600 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Aktif
            </div>
          </div>
          <div className="bg-gray-50 border border-border rounded-xl p-4 shadow-sm min-w-[130px]">
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Tugas Wali</div>
            <div className="text-lg font-black text-text-main flex items-center gap-2">
              <Building2 size={18} className="text-primary" />
              {initialData.rombelWali.length} <span className="text-xs font-medium text-text-muted">Kelas</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modular Tab Navigation */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex border-b border-border overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab("profil")}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap ${
              activeTab === "profil" ? "border-b-2 border-primary text-primary bg-primary/5" : "text-text-muted hover:text-text-main hover:bg-gray-50"
            }`}
          >
            <User size={18} />
            Profil & Kontak
          </button>
          <button 
            onClick={() => setActiveTab("keuangan")}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap ${
              activeTab === "keuangan" ? "border-b-2 border-primary text-primary bg-primary/5" : "text-text-muted hover:text-text-main hover:bg-gray-50"
            }`}
          >
            <CreditCard size={18} />
            Informasi Keuangan
          </button>
          <button 
            onClick={() => setActiveTab("rombel")}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap ${
              activeTab === "rombel" ? "border-b-2 border-primary text-primary bg-primary/5" : "text-text-muted hover:text-text-main hover:bg-gray-50"
            }`}
          >
            <Building2 size={18} />
            Tugas Wali Kelas
            <span className="ml-1.5 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{initialData.rombelWali.length}</span>
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: Profil & Kontak */}
          {activeTab === "profil" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border pb-2">
                    <User size={16} className="text-primary" />
                    Informasi Pribadi
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-medium text-text-muted mb-1">Nama Lengkap & Gelar</div>
                      <div className="text-sm font-semibold text-text-main">{initialData.name}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-text-muted mb-1">Jenis Kelamin</div>
                      <div className="text-sm font-medium text-text-main">{initialData.gender || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-text-muted mb-1">Pendidikan Terakhir</div>
                      <div className="text-sm font-medium text-text-main">{initialData.pendidikan || "-"}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border pb-2">
                    <LinkIcon size={16} className="text-primary" />
                    Kontak & Komunikasi
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-medium text-text-muted mb-1">Nomor WhatsApp / Telepon</div>
                      {initialData.phone ? (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-text-main">{initialData.phone}</span>
                          <a 
                            href={waUrl || "#"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors text-xs font-medium"
                          >
                            <MessageCircle size={14} className="fill-emerald-500 text-white" /> Hubungi
                          </a>
                        </div>
                      ) : (
                        <div className="text-sm italic text-text-muted">Belum dicantumkan</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-text-muted mb-1">Email</div>
                      <div className="text-sm font-medium text-text-main flex items-center gap-2">
                        {initialData.email ? (
                          <>
                            <Mail size={14} className="text-text-muted" />
                            {initialData.email}
                          </>
                        ) : (
                          <span className="italic text-text-muted">Belum dicantumkan</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-text-muted mb-1">Bidang Studi / Tugas Tambahan</div>
                      <div className="text-sm font-medium text-text-main bg-gray-50 p-2.5 rounded-lg border border-border mt-1">
                        {initialData.bidangStudi?.name || "Tidak ada rincian tugas khusus"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Keuangan */}
          {activeTab === "keuangan" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-2xl">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border pb-2">
                  <CreditCard size={16} className="text-primary" />
                  Rekening Bank Pencairan
                </h3>
                
                {initialData.bankName || initialData.bankAccount ? (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl max-w-md relative overflow-hidden">
                    {/* Card decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -ml-10 -mb-10"></div>
                    
                    <div className="relative z-10 flex justify-between items-start mb-8">
                      <CreditCard size={32} className="text-white/80" />
                      <div className="text-sm font-bold tracking-widest text-white/90">
                        {initialData.bankName || "BANK KOSONG"}
                      </div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="text-2xl font-mono tracking-widest mb-2">
                        {initialData.bankAccount?.replace(/(\d{4})/g, '$1 ').trim() || "**** **** ****"}
                      </div>
                      <div className="text-sm text-white/60 uppercase tracking-widest text-xs mb-1">Atas Nama</div>
                      <div className="font-semibold text-lg uppercase tracking-wider text-white/90">
                        {initialData.bankAccountName || initialData.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 bg-gray-50 border border-dashed border-border rounded-2xl">
                    <CreditCard size={48} className="text-gray-300 mb-3" />
                    <p className="font-medium text-text-main">Data rekening belum diisi</p>
                    <p className="text-sm text-text-muted mt-1">Tambahkan info rekening untuk keperluan pencairan/gaji</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Wali Kelas */}
          {activeTab === "rombel" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border pb-2">
                <BookOpen size={16} className="text-primary" />
                Daftar Rombongan Belajar
              </h3>
              
              {initialData.rombelWali.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {initialData.rombelWali.map(rombel => (
                    <div key={rombel.id} className="bg-white border border-border hover:border-primary/50 transition-colors rounded-xl p-4 shadow-sm flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Wali Kelas</div>
                        <div className="font-bold text-text-main text-lg">{rombel.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 border border-dashed border-border rounded-2xl">
                  <Building2 size={48} className="text-gray-300 mb-3" />
                  <p className="font-medium text-text-main">Belum Ada Tugas Wali Kelas</p>
                  <p className="text-sm text-text-muted mt-1">Guru ini belum ditugaskan sebagai wali kelas di rombongan belajar manapun.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* ========================================================== */}
      {/* DEDICATED PRINT LAYOUT - DATA PROFIL GURU                  */}
      {/* ========================================================== */}
      <div className="hidden print:block text-black bg-white font-sans p-4">
        {/* KOP SURAT */}
        <PrintHeader unitInfo={initialData.unitSekolah} pengaturan={pengaturan} className="block" />

        {/* JUDUL */}
        <div className="text-center py-2 bg-gray-100 rounded border border-gray-300 my-4">
          <h2 className="text-base font-extrabold uppercase tracking-wide">DATA PROFIL GURU / STAF</h2>
          <p className="text-xs text-gray-600 mt-0.5">NIP: {initialData.nip || "-"} | Unit: {initialData.unitSekolah?.name || "-"}</p>
        </div>

        {/* TABEL DATA */}
        <table className="w-full text-xs border-collapse mb-6">
          <tbody>
            {[
              ["Nama Lengkap", initialData.name],
              ["NIP / NIK", initialData.nip || "-"],
              ["Unit Sekolah", initialData.unitSekolah?.name || "-"],
              ["Jenis Kelamin", initialData.gender],
              ["Status Kepegawaian", initialData.statusKepegawaian],
              ["Pendidikan Terakhir", initialData.pendidikan || "-"],
              ["Bidang Studi", initialData.bidangStudi?.name || "-"],
              ["No. HP / WA", initialData.phone || "-"],
              ["Email", initialData.email || "-"],
              ["Bank / Rekening", `${initialData.bankName || "-"} / ${initialData.bankAccount || "-"}`],
              ["Wali Kelas", initialData.rombelWali?.map((r: any) => r.name).join(", ") || "-"]
            ].map(([label, value], i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="border border-gray-300 px-3 py-1.5 font-semibold w-48">{label}</td>
                <td className="border border-gray-300 px-3 py-1.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TANDA TANGAN */}
        <PrintSignature
          pengaturan={pengaturan}
          tipe="ganda"
          tanggal={new Date()}
          kiri={{ jabatan: "Mengetahui,", nama: initialData.unitSekolah?.namaKepalaSekolah || "____________________" }}
          kanan={{ jabatan: "Petugas,", nama: userName || "____________________" }}
          className="flex"
        />

        {/* FOOTER */}
        <PrintFooter pengaturan={pengaturan} className="block" />
      </div>

      {isEditing && (
        <GuruFormModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveModal}
          initialData={initialData}
          schoolUnits={schoolUnits}
        />
      )}
    </>
  )
}

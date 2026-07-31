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
  bidangStudi: string | null
  bankName: string | null
  bankAccount: string | null
  bankAccountName: string | null
  isActive: boolean
  unitSekolah: { id: string; name: string }
  rombelWali: Rombel[]
}

export default function GuruDetailClient({ initialData, isReadOnly = false }: { initialData: GuruData, isReadOnly?: boolean }) {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"profil" | "keuangan" | "rombel">("profil")

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

  return (
    <div className="space-y-6 print-content animate-in fade-in duration-500">
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
            onClick={() => toast.error("Fitur Ekspor Excel belum tersedia")}
            className="gap-1.5 text-xs font-semibold bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            <FileSpreadsheet size={15} /> Excel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => toast.error("Fitur Ekspor PDF belum tersedia")}
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
              className="gap-2 text-xs font-bold shadow-sm"
              onClick={() => toast("Silakan gunakan tombol Edit di halaman utama")}
            >
              <Edit2 size={15} /> Edit Data Guru
            </Button>
          )}
        </div>
      </div>

      {/* Hero Banner (360° Profile) */}
      <div className="relative rounded-3xl overflow-hidden mb-8 shadow-sm border border-border bg-white">
        {/* Rich Gradient Background */}
        <div className="h-48 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 relative">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>

        {/* Content Overlapping Banner */}
        <div className="relative px-6 sm:px-10 pb-8 -mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            <div className="flex items-end gap-6">
              {/* Large Avatar */}
              <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-lg relative z-10 shrink-0">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-100 flex items-center justify-center overflow-hidden">
                  <User size={48} className="text-gray-400" />
                </div>
              </div>

              {/* Identity Details */}
              <div className="pb-2">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    initialData.statusKepegawaian === "GTY" ? "bg-emerald-100 text-emerald-700" :
                    initialData.statusKepegawaian === "PNS" ? "bg-purple-100 text-purple-700" :
                    "bg-blue-100 text-blue-700"
                  } shadow-sm backdrop-blur-sm border border-white/20`}>
                    {initialData.statusKepegawaian}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white shadow-sm backdrop-blur-md border border-white/30">
                    {initialData.unitSekolah.name}
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold text-text-main flex items-center gap-3">
                  {initialData.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-text-muted font-medium">
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={16} />
                    <span>NIP/NIK: <span className="font-mono text-text-main font-semibold ml-1">{initialData.nip || "-"}</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Metric KPI Cards */}
            <div className="flex gap-4 pb-2">
              <div className="bg-white/80 backdrop-blur-md border border-white rounded-2xl p-4 shadow-sm min-w-[140px]">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Status</div>
                <div className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Aktif
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-white rounded-2xl p-4 shadow-sm min-w-[140px]">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Tugas Wali</div>
                <div className="text-xl font-bold text-text-main flex items-center gap-2">
                  <Building2 size={20} className="text-primary" />
                  {initialData.rombelWali.length} <span className="text-sm font-medium text-text-muted">Kelas</span>
                </div>
              </div>
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
                      <div className="text-sm font-medium text-text-main">{initialData.gender === "L" ? "Laki-laki" : "Perempuan"}</div>
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
                        {initialData.bidangStudi || "Tidak ada rincian tugas khusus"}
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
  )
}

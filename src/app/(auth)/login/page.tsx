// SIRAYA - Sistem Informasi Yayasan Al-Basyariah
// Halaman Autentikasi Resmi & Pusat Panduan Operasional

"use client"

import { useActionState, useEffect, useState, useRef } from "react"
import { loginAction } from "@/actions/auth"
import { useRouter } from "next/navigation"
import { 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Lock, 
  HelpCircle, 
  MessageSquare, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  GraduationCap, 
  Receipt, 
  TrendingUp, 
  Building2, 
  BookOpen, 
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Info
} from "lucide-react"

// Definisi 4 Modul Unggulan untuk Showcase Interaktif
const MODULE_SHOWCASE = [
  {
    id: "siswa",
    label: "Siswa 360°",
    icon: GraduationCap,
    badge: "Master Data Terpusat",
    title: "Manajemen Data Siswa & Rombel Multi-Unit",
    description: "Pangkalan data terpadu untuk pencatatan berkas murid, histori mutasi rombongan belajar, dan monitoring tunggakan akurat.",
    features: [
      "Pencarian cepat berbasis NIS atau nama siswa",
      "Pencegahan duplikasi NIS antar unit sekolah",
      "Histori kenaikan kelas dan rombel tersimpan rapi"
    ],
    preview: {
      tag: "Kartu Profil Siswa",
      title: "Muhammad Farhan Pratama",
      subtitle: "NIS: 202610482 • Kelas X DKV 1",
      meta1: "Unit: SMK Al-Basyariah",
      meta2: "Status: Aktif",
      statusColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
    }
  },
  {
    id: "kasir",
    label: "Kasir & Tagihan",
    icon: Receipt,
    badge: "Loket Cepat POS",
    title: "Penerimaan Pembayaran SPP & Cetak Resi Instan",
    description: "Proses transaksi loket keuangan dengan validasi otomatis, mendukung pembayaran bertahap dan pencetakan bukti bayar.",
    features: [
      "Pembayaran multi-bulan SPP dalam sekali transaksi",
      "Cetak bukti struk kasir thermal atau dokumen PDF",
      "Jurnal penerimaan kas masuk terupdate otomatis"
    ],
    preview: {
      tag: "Bukti Transaksi Kasir",
      title: "No. Resi: TR-2026-0928-041",
      subtitle: "SPP Oktober 2026 • Rp 350.000",
      meta1: "Metode: Kas Tunai Loket",
      meta2: "LUNAS",
      statusColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
    }
  },
  {
    id: "arus-kas",
    label: "Buku & Arus Kas",
    icon: TrendingUp,
    badge: "Akuntansi Realtime",
    title: "Transparansi Arus Kas & Rekonsiliasi Bank",
    description: "Pengawasan menyeluruh terhadap buku kas masuk, pengeluaran berbasis 5 klasifikasi beban, dan mutasi saldo rekening yayasan.",
    features: [
      "Filter rentang waktu: Hari Ini, Pekan, Bulan Ini, dan Kustom",
      "Kategorisasi beban: Gaji, Operasional, ATK, dan Utilitas",
      "Rekonsiliasi otomatis kas tunai dengan rekening bank"
    ],
    preview: {
      tag: "Ringkasan Finansial Hari Ini",
      title: "Total Arus Kas Masuk: Rp 14.850.000",
      subtitle: "Kas Keluar: Rp 3.200.000 • Surplus: +Rp 11.650.000",
      meta1: "Rekening Bank: Tersinkronisasi",
      meta2: "Buku Kas Stabil",
      statusColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30"
    }
  },
  {
    id: "multi-unit",
    label: "Multi-Unit & RBAC",
    icon: Building2,
    badge: "Integrasi Yayasan",
    title: "Koordinasi Terpadu Seluruh Satuan Pendidikan",
    description: "Satu aplikasi menghubungkan seluruh jenjang pendidikan dengan batasan kewenangan peran yang terlindungi ketat.",
    features: [
      "Terintegrasi untuk TK, SD, SMP, SMA, dan SMK",
      "Pemisahan hak akses: Superadmin, Kepala Sekolah, dan TU",
      "Pencatatan rekam jejak (audit trail) untuk tiap mutasi"
    ],
    preview: {
      tag: "Ekosistem Pendidikan",
      title: "5 Satuan Pendidikan Al-Basyariah",
      subtitle: "TK • SD • SMP • SMA • SMK Terhubung",
      meta1: "Role: Multi-Level RBAC",
      meta2: "Audit Trail Aktif",
      statusColor: "bg-amber-500/20 text-amber-300 border-amber-400/30"
    }
  }
]

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const router = useRouter()
  
  // State form
  const [showPassword, setShowPassword] = useState(false)
  const [isCapsLockOn, setIsCapsLockOn] = useState(false)
  
  // State modal bantuan & panduan
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [guideActiveTab, setGuideActiveTab] = useState<"alur" | "akun" | "bantuan">("alur")
  
  // State carousel showcase kiri
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  // Rotasi otomatis modul showcase setiap 6 detik jika tidak di-hover
  useEffect(() => {
    if (isPaused) return

    timerRef.current = setInterval(() => {
      setActiveModuleIndex((prev) => (prev + 1) % MODULE_SHOWCASE.length)
    }, 6000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused])

  // Keyboard shortcut Escape untuk menutup modal panduan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showGuideModal) {
        setShowGuideModal(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showGuideModal])

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState("CapsLock"))
  }

  const openGuideWithTab = (tab: "alur" | "akun" | "bantuan") => {
    setGuideActiveTab(tab)
    setShowGuideModal(true)
  }

  const currentModule = MODULE_SHOWCASE[activeModuleIndex]

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden">
      {/* =========================================================================
          LEFT BRANDING & INTERACTIVE MODULE SHOWCASE (DESKTOP)
          ========================================================================= */}
      <div 
        className="hidden lg:flex flex-col justify-between flex-1 bg-gradient-to-br from-[#0d8046] via-[#0b6b3a] to-[#074e28] text-white relative overflow-hidden p-10 xl:p-14 select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Header Branding Kiri */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-md">
              <img src="/logo.png" alt="Logo Al-Basyariah" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white m-0">SIRAYA</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/20 text-white border border-white/30">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium m-0">Yayasan Pendidikan Al-Basyariah</p>
            </div>
          </div>

          {/* Indikator Status Server Live */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-xs font-medium text-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Server Online</span>
          </div>
        </div>

        {/* Konten Utama Showcase (Tengah) */}
        <div className="relative z-10 my-auto py-6 max-w-xl">
          {/* Navigasi Tab Modul */}
          <div className="flex items-center gap-2 p-1.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 mb-6">
            {MODULE_SHOWCASE.map((mod, index) => {
              const IconComp = mod.icon
              const isActive = index === activeModuleIndex
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModuleIndex(index)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? "bg-white text-[#0d8046] shadow-md shadow-black/10 scale-[1.02]" 
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <IconComp size={15} />
                  <span>{mod.label}</span>
                </button>
              )
            })}
          </div>

          {/* Deskripsi & Judul Modul Aktif */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
              <ShieldCheck size={13} />
              <span>{currentModule.badge}</span>
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
              {currentModule.title}
            </h2>

            <p className="text-sm text-white/85 leading-relaxed font-normal">
              {currentModule.description}
            </p>

            {/* Checklist Fitur Unggulan */}
            <div className="space-y-2 pt-1">
              {currentModule.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-white/90">
                  <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Kartu Mini Preview Komponen Riil */}
            <div className="mt-6 p-4 rounded-2xl bg-black/25 backdrop-blur-md border border-white/15 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
                <span className="uppercase tracking-wider">{currentModule.preview.tag}</span>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${currentModule.preview.statusColor}`}>
                  {currentModule.preview.meta2}
                </span>
              </div>
              <div className="text-base font-bold text-white tracking-tight">
                {currentModule.preview.title}
              </div>
              <div className="text-xs text-white/80 font-medium">
                {currentModule.preview.subtitle}
              </div>
              <div className="text-[11px] text-white/60 pt-1 border-t border-white/10 flex items-center justify-between">
                <span>{currentModule.preview.meta1}</span>
                <span>Tersimpan di Cloud</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Kiri: Indikator Paginasi & Kontrol Slide */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/70 font-medium">
          <div className="flex items-center gap-2">
            {MODULE_SHOWCASE.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveModuleIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeModuleIndex ? "w-7 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                title={`Lihat modul ${idx + 1}`}
              />
            ))}
            <span className="ml-2 text-[11px] text-white/60">
              {isPaused ? "Rotasi dijeda" : "Rotasi otomatis tiap 6 detik"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => openGuideWithTab("alur")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-emerald-200 transition-colors"
          >
            <BookOpen size={14} />
            <span>Lihat Buku Panduan</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Elemen Dekoratif Halus (Tanpa Noise/Glow Berlebih) */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* =========================================================================
          RIGHT FORM CONTAINER (DESKTOP & MOBILE)
          ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between bg-surface relative z-10 px-6 sm:px-12 w-full overflow-y-auto">
        {/* Bilah Atas Form: Branding Mobile & Tombol Panduan Cepat */}
        <div className="w-full max-w-md mx-auto pt-6 flex items-center justify-between">
          {/* Logo khusus tampilan mobile */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow border border-border">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-base text-text-main tracking-tight">SIRAYA</span>
          </div>

          {/* Spacer desktop */}
          <div className="hidden lg:block"></div>

          {/* Tombol Panduan & Bantuan (Selalu terlihat di semua ukuran layar) */}
          <button
            type="button"
            onClick={() => openGuideWithTab("alur")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text-main bg-bg hover:bg-gray-100 border border-border rounded-xl transition-all shadow-sm"
          >
            <BookOpen size={14} className="text-primary" />
            <span>Panduan & Bantuan</span>
          </button>
        </div>

        {/* Formulir Autentikasi */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-8 text-left">
            <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-text-muted text-sm">Silakan masukkan kredensial akun administrator Anda.</p>
          </div>

          {/* ALERT AKUN TERKUNCI / GAGAL */}
          {state?.isLocked ? (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm flex items-start gap-3 text-rose-800">
              <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                <Lock size={20} />
              </div>
              <div className="space-y-1">
                <strong className="font-bold block text-rose-900">Akun Terkunci Sementara</strong>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {state.error}
                </p>
                <button
                  type="button"
                  onClick={() => openGuideWithTab("bantuan")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 underline hover:text-rose-950 mt-1"
                >
                  <HelpCircle size={13} />
                  Hubungi Bantuan Administrator
                </button>
              </div>
            </div>
          ) : state?.error ? (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm flex items-start gap-3 text-rose-700">
              <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600 shrink-0 mt-0.5">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="font-medium text-xs sm:text-sm">{state.error}</p>
                {state.sisaPercobaan !== undefined && (
                  <p className="text-xs text-rose-600 mt-1 font-semibold">
                    Percobaan gagal berturut-turut akan mengunci akun secara otomatis.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <form action={formAction} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Email Administrator</label>
              <input
                type="email"
                name="email"
                required
                autoFocus
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium placeholder-text-muted/50 text-sm"
                placeholder="admin@albasyariah.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-text-main">Kata Sandi</label>
                <button 
                  type="button" 
                  onClick={() => openGuideWithTab("akun")}
                  className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  onKeyDown={handleKeyEvent}
                  onKeyUp={handleKeyEvent}
                  className="w-full px-4 py-3 pr-12 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium placeholder-text-muted/50 tracking-wider text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* DETEKSI CAPS LOCK AKTIF */}
              {isCapsLockOn && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold animate-in fade-in">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                  <span>Perhatian: <strong>Caps Lock</strong> keyboard Anda aktif</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover focus:ring-4 focus:ring-primary/30 transition-all shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center text-sm"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                  Memverifikasi kredensial...
                </>
              ) : "Masuk ke SIRAYA"}
            </button>
          </form>
        </div>

        {/* Footer Kanan */}
        <div className="w-full max-w-md mx-auto pb-6 text-center text-xs font-medium text-text-muted">
          <div>Hak Cipta &copy; {new Date().getFullYear()} SIRAYA • Yayasan Pendidikan Al-Basyariah.</div>
          <div className="text-[11px] text-text-muted/80 mt-0.5">
            Tahun Ajaran 2026/2027 • Sistem Keuangan & Akademik Terpadu
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL PUSAT PANDUAN & BANTUAN OPERASIONAL
          ========================================================================= */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur dengan klik luar untuk menutup */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowGuideModal(false)}
          ></div>

          <div className="bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-bg/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-text-main text-base">Pusat Panduan & Bantuan</h3>
                  <p className="text-xs text-text-muted">Panduan operasional harian dan prosedur pemulihan akun</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-2 text-text-muted hover:text-text-main rounded-xl hover:bg-gray-100 transition-colors"
                title="Tutup (Escape)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-Navigasi Tab Modal */}
            <div className="flex border-b border-border px-6 pt-3 gap-6 bg-surface">
              <button
                type="button"
                onClick={() => setGuideActiveTab("alur")}
                className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  guideActiveTab === "alur" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                <Receipt size={14} />
                <span>Alur Kerja Kasir</span>
              </button>
              <button
                type="button"
                onClick={() => setGuideActiveTab("akun")}
                className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  guideActiveTab === "akun" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                <Lock size={14} />
                <span>Format Akun & Sandi</span>
              </button>
              <button
                type="button"
                onClick={() => setGuideActiveTab("bantuan")}
                className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  guideActiveTab === "bantuan" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                <HelpCircle size={14} />
                <span>Kontak Helpdesk</span>
              </button>
            </div>

            {/* Isi Konten Tab Modal */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {/* TAB 1: ALUR KERJA KASIR & TU */}
              {guideActiveTab === "alur" && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900">
                    <Info size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Alur Standar Pembayaran Siswa di Loket</strong>
                      <span>Petugas loket disarankan mengikuti 3 langkah runut berikut untuk memastikan integritas buku kas:</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-bg border border-border rounded-2xl flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div>
                        <strong className="block text-text-main font-bold">Cari Siswa pada Menu Pembayaran Tagihan</strong>
                        <p className="text-text-muted mt-0.5">
                          Ketik NIS atau nama murid pada kotak pencarian. Sistem akan menampilkan seluruh pos tagihan aktif (SPP, DSP, Ujian, dll).
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-bg border border-border rounded-2xl flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div>
                        <strong className="block text-text-main font-bold">Centang Tagihan & Pilih Metode Bayar</strong>
                        <p className="text-text-muted mt-0.5">
                          Tandai bulan tagihan yang ingin dibayarkan, tentukan metode transaksi (Kas Tunai Loket atau Rekening Bank), lalu klik Simpan.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-bg border border-border rounded-2xl flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                        3
                      </div>
                      <div>
                        <strong className="block text-text-main font-bold">Cetak Kwitansi / Struk Bukti Bayar</strong>
                        <p className="text-text-muted mt-0.5">
                          Klik tombol Cetak Resi untuk mencetak bukti fisik bagi wali murid. Nomor referensi transaksi tercatat permanen dalam audit log.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FORMAT AKUN & KEAMANAN */}
              {guideActiveTab === "akun" && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1">
                    <strong className="block font-bold">Ketentuan Kredensial Administrator</strong>
                    <p className="text-amber-800">
                      Seluruh akun staf terdaftar menggunakan domain resmi yayasan: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">@albasyariah.com</code>.
                    </p>
                  </div>

                  <div className="space-y-3 text-text-muted">
                    <div className="p-3 bg-bg border border-border rounded-xl">
                      <strong className="text-text-main block font-semibold mb-1">Proteksi Akun Terkunci</strong>
                      Sistem menerapkan batas percobaan kata sandi berturut-turut. Jika terlampaui, akun otomatis terkunci untuk mencegah brute-force.
                    </div>

                    <div className="p-3 bg-bg border border-border rounded-xl">
                      <strong className="text-text-main block font-semibold mb-1">Prosedur Lupa Kata Sandi</strong>
                      Demi perlindungan data finansial sekolah, reset kata sandi tidak melalui tautan publik, melainkan melalui otorisasi Superadmin Sistem atau Tata Usaha Unit.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KONTAK HELPDESK RESMI */}
              {guideActiveTab === "bantuan" && (
                <div className="space-y-3 text-xs">
                  <p className="text-text-muted">
                    Pilih saluran bantuan resmi di bawah ini sesuai kebutuhan kendala Anda:
                  </p>

                  <a
                    href="https://wa.me/6281288880001?text=Halo%20Tata%20Usaha%2C%20saya%20memerlukan%20bantuan%20operasional%20akun%20SIRAYA."
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 bg-bg border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-text-main block group-hover:text-primary transition-colors">
                          WhatsApp Tata Usaha Unit
                        </span>
                        <span className="text-[11px] text-text-muted">Bantuan operasional harian sekolah & administrasi siswa</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      Hubungi <ExternalLink size={12} />
                    </span>
                  </a>

                  <a
                    href="https://wa.me/6281288880002?text=Halo%20Superadmin%20SIRAYA%2C%20akun%20saya%20terkunci%20dan%20memerlukan%20bantuan%20buka%20kunci%20sistem."
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 bg-bg border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                        <Lock size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-text-main block group-hover:text-primary transition-colors">
                          WhatsApp Superadmin Sistem
                        </span>
                        <span className="text-[11px] text-text-muted">Pemulihan akun terkunci, reset sandi & kendala server</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      Hubungi <ExternalLink size={12} />
                    </span>
                  </a>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-bg border-t border-border flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-main hover:bg-gray-100 transition-colors"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

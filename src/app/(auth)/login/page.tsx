// SIRAYA - Sistem Informasi Yayasan Al-Basyariah
// Halaman Autentikasi Resmi & Informasi Modul Operasional

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
  BookOpen, 
  ShieldCheck,
  ExternalLink
} from "lucide-react"

// Definisi 4 Tab Modul & Panduan
const MODULE_SHOWCASE = [
  {
    id: "siswa",
    label: "Data Siswa",
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
    label: "Loket Kasir",
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
    label: "Buku Kas",
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
    id: "panduan",
    label: "Panduan Alur",
    icon: BookOpen,
    badge: "SOP Operasional",
    title: "Alur Standar Transaksi Loket & Administrasi",
    description: "Pedoman kerja harian staf tata usaha dan kasir dalam memproses pembayaran tagihan siswa di loket.",
    features: [
      "1. Cari siswa via NIS/Nama pada menu Pembayaran Tagihan",
      "2. Tandai pos tagihan (SPP/DSP) & tentukan metode bayar",
      "3. Simpan dan cetak bukti transaksi/resi untuk wali murid"
    ],
    preview: {
      tag: "Panduan Loket",
      title: "3 Langkah Transaksi Cepat",
      subtitle: "Cari Siswa -> Pilih Tagihan -> Cetak Kwitansi",
      meta1: "Bantuan: Hubungi TU Unit",
      meta2: "SOP RESMI",
      statusColor: "bg-blue-500/20 text-blue-300 border-blue-400/30"
    }
  }
]

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const router = useRouter()
  
  // State form
  const [showPassword, setShowPassword] = useState(false)
  const [isCapsLockOn, setIsCapsLockOn] = useState(false)
  
  // State modal bantuan darurat
  const [showHelpModal, setShowHelpModal] = useState(false)
  
  // State carousel slide
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  // Rotasi otomatis halus setiap 6 detik (jeda hening saat kursor hover)
  useEffect(() => {
    if (isPaused) return

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % MODULE_SHOWCASE.length)
    }, 6000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused])

  // Keyboard shortcut Escape untuk menutup modal bantuan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showHelpModal) {
        setShowHelpModal(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showHelpModal])

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState("CapsLock"))
  }

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden">
      {/* =========================================================================
          LEFT BRANDING & SMOOTH SLIDE SHOWCASE (DESKTOP)
          ========================================================================= */}
      <div 
        className="hidden lg:flex flex-col justify-between flex-1 bg-gradient-to-br from-[#0d8046] via-[#0b6b3a] to-[#074e28] text-white relative overflow-hidden p-10 xl:p-14 select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Header Branding Kiri (Bersih dari badge v2.4 dan server online) */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-md">
            <img src="/logo.png" alt="Logo Al-Basyariah" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white m-0">SIRAYA</h1>
            <p className="text-xs text-white/80 font-medium m-0">Yayasan Pendidikan Al-Basyariah</p>
          </div>
        </div>

        {/* Konten Utama Showcase (Tengah) */}
        <div className="relative z-10 my-auto py-4 max-w-xl w-full">
          {/* Navigasi Tab Modul & Panduan */}
          <div className="flex items-center gap-1.5 p-1.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 mb-6">
            {MODULE_SHOWCASE.map((mod, index) => {
              const IconComp = mod.icon
              const isActive = index === activeIndex
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                    isActive 
                      ? "bg-white text-[#0d8046] shadow-sm font-bold" 
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <IconComp size={15} />
                  <span>{mod.label}</span>
                </button>
              )
            })}
          </div>

          {/* Area Slider Horizontal dengan Easing Deceleration Halus */}
          <div className="w-full overflow-hidden">
            <div 
              className="flex w-full transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {MODULE_SHOWCASE.map((mod) => (
                <div
                  key={mod.id}
                  className="w-full min-w-full shrink-0 flex flex-col justify-between space-y-4 pr-1"
                >
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                      <ShieldCheck size={13} />
                      <span>{mod.badge}</span>
                    </div>

                    <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-snug">
                      {mod.title}
                    </h2>

                    <p className="text-xs xl:text-sm text-white/85 leading-relaxed font-normal min-h-[42px]">
                      {mod.description}
                    </p>

                    {/* Checklist Fitur */}
                    <div className="space-y-2 pt-1 min-h-[72px]">
                      {mod.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-xs text-white/90">
                          <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kartu Mini Preview */}
                  <div className="mt-4 p-4 rounded-2xl bg-black/25 backdrop-blur-md border border-white/15 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
                      <span className="uppercase tracking-wider">{mod.preview.tag}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${mod.preview.statusColor}`}>
                        {mod.preview.meta2}
                      </span>
                    </div>
                    <div className="text-sm xl:text-base font-bold text-white tracking-tight">
                      {mod.preview.title}
                    </div>
                    <div className="text-xs text-white/80 font-medium">
                      {mod.preview.subtitle}
                    </div>
                    <div className="text-[11px] text-white/60 pt-1 border-t border-white/10 flex items-center justify-between">
                      <span>{mod.preview.meta1}</span>
                      <span>Tersimpan di Cloud</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Kiri: Dots Indicator */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
          {/* Dots Indicator Slide */}
          <div className="flex items-center gap-2">
            {MODULE_SHOWCASE.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ease-out cursor-pointer ${
                  idx === activeIndex 
                    ? "w-8 bg-white shadow-sm" 
                    : "w-2 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Ke slide ${idx + 1}`}
              />
            ))}
          </div>
          <div className="text-[11px] text-white/60 font-medium">
            Sistem Informasi Terpadu
          </div>
        </div>

        {/* Elemen Dekoratif Halus */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* =========================================================================
          RIGHT FORM CONTAINER (DESKTOP & MOBILE)
          ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between bg-surface relative z-10 px-6 sm:px-12 w-full overflow-y-auto">
        {/* Bilah Atas Form: Branding Mobile (Bersih dari tombol bantuan atas) */}
        <div className="w-full max-w-md mx-auto pt-6 flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow border border-border">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-base text-text-main tracking-tight">SIRAYA</span>
          </div>
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
                  onClick={() => setShowHelpModal(true)}
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
                  onClick={() => setShowHelpModal(true)}
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
          MODAL BANTUAN & RESET SANDI
          ========================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHelpModal(false)}></div>
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-text-main text-base">Bantuan & Reset Kata Sandi</h3>
                  <p className="text-xs text-text-muted">Prosedur resmi pemulihan akses akun</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 text-text-muted hover:text-text-main rounded-lg hover:bg-bg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              Untuk menjaga integritas dan keamanan data yayasan, pemulihan akun tidak dilakukan melalui tautan email publik, melainkan melalui otorisasi Admin Utama atau Staf Tata Usaha yang berwenang.
            </p>

            <div className="space-y-2.5 pt-1">
              <a
                href="https://wa.me/6281288880001?text=Halo%20Tata%20Usaha%2C%20saya%20memerlukan%20bantuan%20reset%20kata%20sandi%20akun%20SIRAYA."
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 bg-bg border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-text-main block group-hover:text-primary transition-colors">WhatsApp Tata Usaha Unit</span>
                    <span className="text-[11px] text-text-muted">Bantuan operasional harian sekolah</span>
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
                className="flex items-center justify-between p-3 bg-bg border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                    <Lock size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-text-main block group-hover:text-primary transition-colors">WhatsApp Superadmin Sistem</span>
                    <span className="text-[11px] text-text-muted">Pemulihan akun terkunci / darurat</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  Hubungi <ExternalLink size={12} />
                </span>
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 bg-bg border border-border rounded-xl text-xs font-semibold text-text-main hover:bg-gray-100 transition-colors"
              >
                Kembali ke Halaman Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

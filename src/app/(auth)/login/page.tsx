// SIRAYA - Sistem Informasi Yayasan Al Basyariah (Tampilan Login Resmi)
"use client"

import { useActionState, useEffect, useState } from "react"
import { loginAction } from "@/actions/auth"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertTriangle, Lock, HelpCircle, MessageSquare, X, ShieldAlert } from "lucide-react"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isCapsLockOn, setIsCapsLockOn] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState("CapsLock"))
  }

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden">
      {/* LEFT BRANDING BANNER */}
      <div className="hidden lg:flex flex-col justify-center flex-1 bg-gradient-to-br from-[#0d8046] to-[#0b6b3a] text-white relative overflow-hidden p-12 xl:p-20">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold m-0 tracking-tight text-white drop-shadow-md">SIRAYA</h1>
              <span className="text-lg text-white/90 font-medium">Sistem Informasi Yayasan Al Basyariah</span>
            </div>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6 max-w-xl text-white">
            Kelola Manajemen Sekolah dengan Lebih Cerdas & Terintegrasi
          </h2>
          
          <p className="text-lg text-white/80 leading-relaxed max-w-xl mb-12">
            Platform digital terpadu untuk administrasi, akademik, dan keuangan seluruh unit pendidikan di bawah naungan Yayasan Al Basyariah.
          </p>

          <div className="flex gap-10 text-white/90">
            <div>
              <h4 className="text-3xl font-bold mb-1 drop-shadow-sm">3+</h4>
              <span className="text-sm font-medium">Unit Sekolah</span>
            </div>
            <div>
              <h4 className="text-3xl font-bold mb-1 drop-shadow-sm">Terpadu</h4>
              <span className="text-sm font-medium">Sistem Keuangan</span>
            </div>
            <div>
              <h4 className="text-3xl font-bold mb-1 drop-shadow-sm">Otomatis</h4>
              <span className="text-sm font-medium">Rekap Laporan</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="absolute -bottom-48 -right-48 w-[800px] h-[800px] bg-albas-yellow/10 rounded-full blur-3xl mix-blend-overlay"></div>
      </div>

      {/* RIGHT FORM CONTAINER */}
      <div className="flex-1 flex flex-col items-center justify-center bg-surface relative z-10 px-6 sm:px-12 w-full overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-8 text-left">
            <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-text-muted text-base">Silakan masukkan kredensial akun administrator Anda.</p>
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
                <p className="font-medium">{state.error}</p>
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
                  Sedang memverifikasi kredensial...
                </>
              ) : "Masuk ke SIRAYA"}
            </button>
          </form>
          
          <div className="mt-10 text-center text-xs font-medium text-text-muted">
            &copy; {new Date().getFullYear()} SIRAYA - Yayasan Al Basyariah.<br/>
            Dilindungi sistem proteksi berlapis & standar enkripsi data.
          </div>
        </div>
      </div>

      {/* MODAL HELPDESK & RESET SANDI */}
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
                <span className="text-xs font-semibold text-primary">Hubungi &rarr;</span>
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
                <span className="text-xs font-semibold text-primary">Hubungi &rarr;</span>
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

"use client"

import { useActionState, useEffect, useState } from "react"
import { loginAction } from "@/actions/auth"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden">
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

      <div className="flex-1 flex flex-col items-center justify-center bg-surface relative z-10 px-6 sm:px-12 w-full">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10 text-left">
            <h2 className="text-3xl font-bold text-text-main mb-2">Selamat Datang Kembali</h2>
            <p className="text-text-muted text-lg">Silakan masuk ke akun administrator Anda.</p>
          </div>

          <form action={formAction} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Email Administrator</label>
              <input
                type="email"
                name="email"
                required
                autoFocus
                className="w-full px-4 py-3.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium placeholder-text-muted/50"
                placeholder="admin@albasyariah.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-text-main">Kata Sandi</label>
                <button 
                  type="button" 
                  onClick={() => toast("Silakan hubungi Administrator Utama atau Tata Usaha untuk mereset kata sandi Anda menjadi default.", { icon: '🔒' })}
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
                  className="w-full px-4 py-3.5 pr-12 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium placeholder-text-muted/50 tracking-wider"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {state?.error && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-50 shrink-0"></span>
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover focus:ring-4 focus:ring-primary/30 transition-all shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPending ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                  Sedang memverifikasi...
                </>
              ) : "Masuk ke SIRAYA"}
            </button>
          </form>
          
          <div className="mt-12 text-center text-sm font-medium text-text-muted">
            &copy; {new Date().getFullYear()} SIRAYA - Yayasan Al Basyariah.<br/>Dikembangkan dengan <span className="text-red-500 animate-pulse inline-block mx-1">♥</span> untuk pendidikan.
          </div>
        </div>
      </div>
    </div>
  )
}

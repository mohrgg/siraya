"use client"

import { useActionState, useEffect } from "react"
import { loginAction } from "@/actions/auth"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="login-left-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>SIRAYA</h1>
              <span style={{ fontSize: '1rem', opacity: 0.9 }}>Sistem Informasi Yayasan Al Basyariah</span>
            </div>
          </div>
          
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1.2, marginBottom: '1.5rem', maxWidth: '480px' }}>
            Kelola Manajemen Sekolah dengan Lebih Cerdas & Terintegrasi
          </h2>
          
          <p style={{ fontSize: '1.125rem', opacity: 0.8, lineHeight: 1.6, maxWidth: '480px', marginBottom: '3rem' }}>
            Platform digital terpadu untuk administrasi, akademik, dan keuangan seluruh unit pendidikan di bawah naungan Yayasan Al Basyariah.
          </p>

          <div style={{ display: 'flex', gap: '2rem', opacity: 0.8 }}>
            <div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>3+</h4>
              <span style={{ fontSize: '0.875rem' }}>Unit Sekolah</span>
            </div>
            <div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>Terpadu</h4>
              <span style={{ fontSize: '0.875rem' }}>Sistem Keuangan</span>
            </div>
            <div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>Otomatis</h4>
              <span style={{ fontSize: '0.875rem' }}>Rekap Laporan</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="login-deco-1"></div>
        <div className="login-deco-2"></div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Selamat Datang Kembali</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Silakan masuk ke akun administrator Anda.</p>
          </div>

          <form action={formAction}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Email Administrator</label>
              <input
                type="email"
                name="email"
                required
                className="form-input"
                placeholder="admin@albasyariah.com"
                style={{ padding: '0.875rem 1rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Kata Sandi</label>
              <input
                type="password"
                name="password"
                required
                className="form-input"
                placeholder="••••••••"
                style={{ padding: '0.875rem 1rem' }}
              />
            </div>

            {state?.error && (
              <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary"
              style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', borderRadius: '12px' }}
            >
              {isPending ? "Sedang memverifikasi..." : "Masuk ke SIRAYA"}
            </button>
          </form>
          
          <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} SIRAYA - Yayasan Al Basyariah.<br/>Dikembangkan dengan <span style={{color: 'red'}}>♥</span> untuk pendidikan.
          </div>
        </div>
      </div>
    </div>
  )
}

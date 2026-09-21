"use client"

import { useEffect } from "react"
import { AlertCircle, RotateCcw, Home } from "lucide-react"
import Link from "next/link"
import { reportClientError } from "@/lib/client-error-reporter"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportClientError({
      error,
      digest: error.digest,
      metadata: { boundary: "dashboard-segment-error" }
    })
  }, [error])

  return (
    <div className="w-full flex items-center justify-center min-h-[60vh] p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-text-main tracking-tight mb-2">
          Gagal Memuat Konten
        </h2>
        <p className="text-xs sm:text-sm text-text-muted mb-4 leading-relaxed">
          Terjadi kesalahan saat memproses data halaman ini. Telemetri telah dicatat pada sistem untuk penanganan.
        </p>
        {error.digest && (
          <div className="mb-6 p-2 rounded-lg bg-bg border border-border text-text-muted font-mono text-[11px] select-all">
            Digest: {error.digest}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs sm:text-sm font-semibold transition-colors min-h-[44px] cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>Coba Lagi</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface hover:bg-slate-50 border border-border text-text-main text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
          >
            <Home size={15} />
            <span>Ke Dashboard Utama</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

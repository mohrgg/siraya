"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { reportClientError } from "@/lib/client-error-reporter"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportClientError({ error, digest: error.digest, metadata: { boundary: "global-error" } })
  }, [error])

  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
            Terjadi Kendala Sistem
          </h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Aplikasi mengalami kendala tak terduga. Laporan error telah otomatis dikirimkan ke tim teknis untuk ditindaklanjuti.
          </p>
          {error.digest && (
            <div className="mb-6 p-2.5 rounded-lg bg-slate-100 text-slate-500 font-mono text-xs select-all">
              Kode Laporan: {error.digest}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-sm font-semibold transition-colors min-h-[44px] cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>Muat Ulang Halaman</span>
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold transition-colors min-h-[44px]"
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}

"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/Button"
import { 
  X, 
  BookOpen, 
  CheckSquare, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  Wallet, 
  Receipt, 
  AlertTriangle, 
  Check, 
  Minus,
  HelpCircle,
  ShieldCheck,
  Building2,
  CheckCircle2
} from "lucide-react"

interface AkunKeuanganGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = "CHECKBOX_RULES" | "FLOW" | "HIERARCHY" | "SECURITY"

export function AkunKeuanganGuideModal({ isOpen, onClose }: AkunKeuanganGuideModalProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("CHECKBOX_RULES")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll saat modal aktif
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-hidden="true"
    >
      <div 
        className="w-full max-w-3xl bg-surface rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] relative z-10 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-bg/50 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-text-main m-0 leading-tight truncate">
                Panduan & Tata Kelola Akun Keuangan
              </h3>
              <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 truncate">
                Standar aturan penandaan akun, struktur hirarki, dan alur transaksi
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            type="button"
            aria-label="Tutup panduan"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigasi Internal Modal */}
        <div className="flex border-b border-border bg-surface px-4 sm:px-5 gap-1 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("CHECKBOX_RULES")}
            className={`py-3 px-3 sm:px-4 min-h-[44px] touch-manipulation text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "CHECKBOX_RULES"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main hover:border-border"
            }`}
          >
            <CheckSquare size={16} />
            <span>Aturan Penandaan Akun</span>
            <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-extrabold uppercase border border-rose-200">
              Krusial
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("FLOW")}
            className={`py-3 px-3 sm:px-4 min-h-[44px] touch-manipulation text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "FLOW"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main hover:border-border"
            }`}
          >
            <Sparkles size={16} />
            <span>Alur Tambah Akun</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HIERARCHY")}
            className={`py-3 px-3 sm:px-4 min-h-[44px] touch-manipulation text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "HIERARCHY"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main hover:border-border"
            }`}
          >
            <Layers size={16} />
            <span>Struktur Hirarki Akun</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SECURITY")}
            className={`py-3 px-3 sm:px-4 min-h-[44px] touch-manipulation text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "SECURITY"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main hover:border-border"
            }`}
          >
            <ShieldAlert size={16} />
            <span>Proteksi Integritas Data</span>
          </button>
        </div>

        {/* Body Konten Modal (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-6">
          
          {/* ===================== TAB 1: ATURAN CENTANG CHECKBOX ===================== */}
          {activeTab === "CHECKBOX_RULES" && (
            <div className="space-y-6">
              
              {/* Alert Callout Profesional */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block mb-0.5 text-amber-900">Perhatian Khusus Aturan Akun</span>
                  Saat membuat atau memperbarui akun transaksi, perhatikan dua opsi penandaan di bawah form. Ketepatan penandaan menentukan ketersediaan akun pada formulir transaksi dan keabsahan laporan keuangan.
                </div>
              </div>

              {/* 3 Form Mockup Cards (Antislop UI: No Emoji, Pure SVG & Clean Badges) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* KARTU 1: KAS & BANK */}
                <div className="bg-surface rounded-xl border border-emerald-200 shadow-2xs overflow-hidden flex flex-col">
                  <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Wallet size={16} className="text-emerald-700" />
                      <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">1. Akun Kas / Bank</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                      Uang Likuid
                    </span>
                  </div>

                  {/* UI Form Mockup Simulasi */}
                  <div className="p-3.5 bg-bg/50 border-b border-border space-y-2.5 text-[11px] font-medium">
                    <div className="bg-surface p-2 rounded-lg border border-border">
                      <span className="text-text-muted text-[10px] block">Kode & Nama Akun:</span>
                      <span className="font-bold text-text-main">1101 - Kas Tunai Yayasan</span>
                    </div>

                    <div className="bg-surface p-2 rounded-lg border border-border">
                      <span className="text-text-muted text-[10px] block">Induk (Subklasifikasi):</span>
                      <span className="font-bold text-text-main">11 - Kas & Bank</span>
                    </div>

                    {/* Checkbox 1: Dicentang */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-300">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-emerald-950 text-xs">Akun Kas / Bank</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                        Wajib Aktif
                      </span>
                    </div>

                    {/* Checkbox 2: Kosong */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border opacity-70">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-slate-300 bg-surface shrink-0" />
                        <span className="text-text-muted text-xs">Pos Tagihan SPP</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        Kosong
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-surface text-xs text-text-main space-y-1 mt-auto">
                    <p className="font-bold text-emerald-800">Kapan Digunakan?</p>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Untuk brankas tunai, kasir sekolah, dan rekening bank. Akun ini akan muncul di menu <strong>Kas Masuk, Kas Keluar, & Pembayaran Tagihan</strong>.
                    </p>
                  </div>
                </div>

                {/* KARTU 2: TAGIHAN SISWA / SPP */}
                <div className="bg-surface rounded-xl border border-amber-200 shadow-2xs overflow-hidden flex flex-col">
                  <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Receipt size={16} className="text-amber-700" />
                      <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">2. Tagihan Siswa (SPP)</span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                      Tagihan Rutin
                    </span>
                  </div>

                  {/* UI Form Mockup Simulasi */}
                  <div className="p-3.5 bg-bg/50 border-b border-border space-y-2.5 text-[11px] font-medium">
                    <div className="bg-surface p-2 rounded-lg border border-border">
                      <span className="text-text-muted text-[10px] block">Kode & Nama Akun:</span>
                      <span className="font-bold text-text-main">4101 - SPP Kelas X</span>
                    </div>

                    <div className="bg-surface p-2 rounded-lg border border-border">
                      <span className="text-text-muted text-[10px] block">Induk (Subklasifikasi):</span>
                      <span className="font-bold text-text-main">41 - Pendapatan Operasional</span>
                    </div>

                    {/* Checkbox 1: Kosong */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border opacity-70">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-slate-300 bg-surface shrink-0" />
                        <span className="text-text-muted text-xs">Akun Kas / Bank</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        Kosong
                      </span>
                    </div>

                    {/* Checkbox 2: Dicentang */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-300">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-amber-950 text-xs">Pos Tagihan SPP</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                        Wajib Aktif
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-surface text-xs text-text-main space-y-1 mt-auto">
                    <p className="font-bold text-amber-800">Kapan Digunakan?</p>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Untuk pos biaya pendidikan santri/siswa (SPP, PSB, Uang Gedung). Akun ini otomatis tersedia sebagai pilihan saat membuat <strong>Tagihan Siswa</strong>.
                    </p>
                  </div>
                </div>

                {/* KARTU 3: BEBAN OPERASIONAL / PENGELUARAN */}
                <div className="bg-surface rounded-xl border border-rose-200 shadow-2xs overflow-hidden flex flex-col">
                  <div className="p-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Minus size={16} className="text-rose-600" />
                      <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wide">3. Beban & Biaya Operasional</span>
                    </div>
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                      Tanpa Penandaan
                    </span>
                  </div>

                  {/* UI Form Mockup Simulasi */}
                  <div className="p-3.5 bg-bg/50 border-b border-border space-y-2.5 text-[11px] font-medium">
                    <div className="bg-surface p-2 rounded-lg border border-border">
                      <span className="text-text-muted text-[10px] block">Kode & Nama Akun:</span>
                      <span className="font-bold text-text-main">5101 - Beban Listrik & Air</span>
                    </div>

                    <div className="bg-surface p-2 rounded-lg border border-border">
                      <span className="text-text-muted text-[10px] block">Induk (Subklasifikasi):</span>
                      <span className="font-bold text-text-main">51 - Beban Operasional</span>
                    </div>

                    {/* Checkbox 1: Dilarang */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-rose-300 bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                          <X size={12} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-xs text-rose-950">Akun Kas / Bank</span>
                      </div>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                        Dilarang
                      </span>
                    </div>

                    {/* Checkbox 2: Dilarang */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-rose-300 bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                          <X size={12} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-xs text-rose-950">Pos Tagihan SPP</span>
                      </div>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                        Dilarang
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-surface text-xs text-text-main space-y-1 mt-auto">
                    <p className="font-bold text-rose-800">Aturan Penting:</p>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      <strong>Biarkan kedua opsi kosong.</strong> Akun biaya operasional (listrik, gaji, ATK, konsumsi) maupun pendapatan umum tidak boleh ditandai sebagai kas ataupun tagihan siswa.
                    </p>
                  </div>
                </div>

              </div>

              {/* Tabel Matriks Ringkas (Antislop UI: Pure SVG Icons) */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-bg/80 border-b border-border text-text-muted font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Kategori Akun</th>
                      <th className="p-3">Contoh Akun Nyata</th>
                      <th className="p-3 text-center">Centang Kas/Bank?</th>
                      <th className="p-3 text-center">Centang SPP?</th>
                      <th className="p-3">Dampak di Sistem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-bg/40">
                      <td className="p-3 font-bold text-emerald-800 flex items-center gap-1.5">
                        <Wallet size={14} className="text-emerald-700" /> Kas & Bank
                      </td>
                      <td className="p-3 font-medium text-text-main">Kas Tunai Yayasan, Kasir SMK, Bank BSI</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                          <Check size={12} strokeWidth={3} className="text-emerald-700" />
                          <span>Wajib</span>
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                          <Minus size={12} strokeWidth={2} />
                          <span>Kosong</span>
                        </span>
                      </td>
                      <td className="p-3 text-text-muted">Muncul di formulir Kas Masuk, Kas Keluar, & Pembayaran</td>
                    </tr>
                    <tr className="hover:bg-bg/40">
                      <td className="p-3 font-bold text-amber-800 flex items-center gap-1.5">
                        <Receipt size={14} className="text-amber-700" /> Tagihan Siswa (SPP)
                      </td>
                      <td className="p-3 font-medium text-text-main">SPP Kelas X, SPP Santri, Uang Gedung</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                          <Minus size={12} strokeWidth={2} />
                          <span>Kosong</span>
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                          <Check size={12} strokeWidth={3} className="text-amber-700" />
                          <span>Wajib</span>
                        </span>
                      </td>
                      <td className="p-3 text-text-muted">Tersedia saat pembuatan Tagihan Santri/Siswa</td>
                    </tr>
                    <tr className="hover:bg-bg/40">
                      <td className="p-3 font-bold text-rose-800 flex items-center gap-1.5">
                        <Minus size={14} className="text-rose-600" /> Beban / Biaya Operasional
                      </td>
                      <td className="p-3 font-medium text-text-main">Listrik, Gaji, ATK, Konsumsi Rapat</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px]">
                          <X size={12} strokeWidth={2.5} />
                          <span>Dilarang</span>
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px]">
                          <X size={12} strokeWidth={2.5} />
                          <span>Dilarang</span>
                        </span>
                      </td>
                      <td className="p-3 text-text-muted">Menjadi akun tujuan pengeluaran murni pada formulir Kas Keluar</td>
                    </tr>
                    <tr className="hover:bg-bg/40">
                      <td className="p-3 font-bold text-blue-800 flex items-center gap-1.5">
                        <Building2 size={14} className="text-blue-700" /> Pendapatan Non-SPP
                      </td>
                      <td className="p-3 font-medium text-text-main">Sumbangan, Hasil Usaha Kantin, Hibah</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                          <Minus size={12} strokeWidth={2} />
                          <span>Kosong</span>
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                          <Minus size={12} strokeWidth={2} />
                          <span>Kosong</span>
                        </span>
                      </td>
                      <td className="p-3 text-text-muted">Penerimaan kas umum melalui formulir Kas Masuk</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ===================== TAB 2: ALUR CEPAT TAMBAH AKUN ===================== */}
          {activeTab === "FLOW" && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-primary text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                <Sparkles size={18} className="shrink-0" />
                <span>Tahapan Menambah Akun Transaksi Baru di Siraya</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Step 1 */}
                <div className="p-4 rounded-xl border border-border bg-bg/30 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-primary text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    1
                  </div>
                  <h4 className="text-sm font-extrabold text-text-main">Pastikan Subklasifikasi Induk</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Periksa apakah kategori induk akun sudah ada di tab <strong>"Kategori / Subklasifikasi"</strong> (contoh: <em>11 - Kas & Bank</em> atau <em>51 - Beban Operasional</em>). Jika belum, tambahkan terlebih dahulu.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl border border-border bg-bg/30 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-primary text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    2
                  </div>
                  <h4 className="text-sm font-extrabold text-text-main">Buka Formulir Tambah Data</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Masuk ke tab <strong>"Daftar Akun Transaksi"</strong>, kemudian klik tombol <strong>"+ Tambah Data"</strong> di kanan atas toolbar untuk membuka panel samping (drawer).
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl border border-border bg-bg/30 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-primary text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    3
                  </div>
                  <h4 className="text-sm font-extrabold text-text-main">Terapkan Aturan Penandaan</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Pilih Induk, isi nama akun, dan sesuaikan penandaan:
                    <br />- Rekening/Kas: Centang <strong>Akun Kas/Bank</strong>.
                    <br />- SPP/Biaya Pendidikan: Centang <strong>Pos Tagihan SPP</strong>.
                    <br />- Biaya Operasional: <strong>Biarkan kedua opsi kosong</strong>.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl border border-border bg-bg/30 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-primary text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    4
                  </div>
                  <h4 className="text-sm font-extrabold text-text-main">Simpan & Akun Siap Digunakan</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Klik <strong>"Simpan"</strong>. Akun baru langsung aktif dan tersedia di menu pembuatan tagihan, kas masuk, kas keluar, atau laporan keuangan sesuai klasifikasinya.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* ===================== TAB 3: STRUKTUR HIRARKI AKUN ===================== */}
          {activeTab === "HIERARCHY" && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Siraya menerapkan standar akuntansi 3 tingkat untuk menjamin konsistensi laporan laba rugi, neraca, dan arus kas yayasan:
              </p>

              <div className="space-y-3">
                {/* Level 1 */}
                <div className="p-4 rounded-xl border border-border bg-bg/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                      Tingkat 1 - Kepala Akun (Klasifikasi Utama)
                    </span>
                    <h4 className="text-sm font-bold text-text-main">Kode 1 Digit (Bawaan Sistem)</h4>
                    <p className="text-xs text-text-muted">
                      1 Harta (Aset), 2 Kewajiban (Hutang), 3 Modal (Ekuitas), 4 Pendapatan, 5 Beban (Biaya).
                    </p>
                  </div>
                  <div className="shrink-0 flex gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">1 Harta</span>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">4 Pendapatan</span>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">5 Beban</span>
                  </div>
                </div>

                {/* Level 2 */}
                <div className="p-4 rounded-xl border border-border bg-bg/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Tingkat 2 - Kategori (Subklasifikasi)
                    </span>
                    <h4 className="text-sm font-bold text-text-main">Kode 2 Digit (Kelompok Akun)</h4>
                    <p className="text-xs text-text-muted">
                      Mengelompokkan pos akun sejenis di bawah kepala akun. Contoh: <strong>11</strong> (Kas & Bank), <strong>41</strong> (Pendapatan Operasional), <strong>51</strong> (Beban Operasional).
                    </p>
                  </div>
                  <div className="shrink-0 text-xs font-semibold text-text-muted bg-surface px-3 py-1.5 rounded-lg border border-border">
                    Dikelola di Tab Subklasifikasi
                  </div>
                </div>

                {/* Level 3 */}
                <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                      Tingkat 3 - Akun Detail (Akun Transaksional)
                    </span>
                    <h4 className="text-sm font-bold text-text-main">Kode 4 Digit (Akun Transaksi Riil)</h4>
                    <p className="text-xs text-text-muted">
                      <strong>Hanya akun pada tingkat ini</strong> yang dapat dipilih saat mencatat transaksi kas masuk, kas keluar, kwitansi, dan pembuatan tagihan.
                    </p>
                  </div>
                  <div className="shrink-0 text-xs font-bold text-primary bg-surface px-3 py-1.5 rounded-lg border border-primary/20">
                    Contoh: 1101, 4101, 5101
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 4: PROTEKSI HAPUS DATA ===================== */}
          {activeTab === "SECURITY" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-black text-rose-900">
                  <ShieldAlert size={18} className="text-rose-600" />
                  <span>Prinsip Integritas Audit Keuangan</span>
                </div>
                <p>
                  Sistem akuntansi Siraya menerapkan <strong>Integritas Relasional Bertingkat</strong> untuk menjaga keabsahan pembukuan:
                </p>
              </div>

              <div className="space-y-3 text-xs text-text-main">
                <div className="p-3.5 rounded-xl border border-border bg-surface flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-text-main text-sm">Subklasifikasi Tidak Kosong</h5>
                    <p className="text-text-muted mt-0.5 leading-relaxed">
                      Subklasifikasi tidak dapat dihapus jika masih menaungi akun detail di bawahnya. Pindahkan atau hapus akun-akun detail terlebih dahulu sebelum menghapus subklasifikasi induk.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-surface flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-text-main text-sm">Akun Terikat Riwayat Transaksi atau Tagihan</h5>
                    <p className="text-text-muted mt-0.5 leading-relaxed">
                      Akun yang sudah pernah digunakan pada transaksi (Kas Masuk/Keluar) atau pernah dikaitkan ke Tagihan Siswa <strong>dikunci permanen dari penghapusan</strong> agar saldo buku besar dan riwayat masa lalu tidak rusak.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-950 text-sm">Solusi Terbaik: Nonaktifkan Akun (isActive)</h5>
                    <p className="text-emerald-900 mt-0.5 leading-relaxed">
                      Jika suatu akun sudah tidak dipakai lagi, klik tombol <strong>"Edit"</strong> pada akun tersebut, lalu nonaktifkan tombol sakelar <strong>"Status Akun: Aktif"</strong>. Akun tidak akan muncul lagi pada formulir transaksi baru, sementara pembukuan masa lalu tetap aman.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="p-3.5 sm:p-5 border-t border-border bg-surface flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] sm:text-xs text-text-muted hidden sm:flex items-center gap-1.5">
            <HelpCircle size={14} className="text-primary" />
            <span>Butuh bantuan lebih lanjut? Hubungi administrator keuangan yayasan</span>
          </div>
          <Button 
            variant="primary" 
            onClick={onClose} 
            className="w-full sm:w-auto font-bold px-6 min-h-[44px] shadow-2xs"
          >
            Saya Paham & Tutup
          </Button>
        </div>

      </div>
    </div>,
    document.body
  )
}

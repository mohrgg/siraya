"use client"

import React, { useState, useRef } from "react"
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, Loader2, Link2, RotateCcw } from "lucide-react"
import toast from "react-hot-toast"
import { compressImageToBase64 } from "@/lib/image-utils"

interface LogoUploaderProps {
  value?: string | null
  onChange: (base64OrUrl: string) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
  defaultLogo?: string
}

export default function LogoUploader({
  value,
  onChange,
  label = "Logo Laporan & Dokumen",
  description = "Ditampilkan di sebelah kiri kop surat pada seluruh dokumen dan laporan.",
  disabled = false,
  className = "",
  defaultLogo = "/logo.png"
}: LogoUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (disabled || isProcessing) return

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      toast.error("Format file tidak didukung. Harap pilih gambar (PNG, JPG, WebP, SVG).")
      return
    }

    // Batas file asli sebelum kompresi (Maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 5MB.")
      return
    }

    setIsProcessing(true)
    const toastId = toast.loading("Mengompresi & memproses logo...")

    try {
      // Kompresi dan konversi langsung ke Base64 Data URI di browser
      const base64String = await compressImageToBase64(file, 512, 0.88)

      onChange(base64String)
      toast.success("Logo berhasil diproses! Jangan lupa klik Simpan Perubahan.", { id: toastId })
    } catch (err: any) {
      console.error("Image processing error:", err)
      toast.error(err.message || "Gagal memproses gambar logo.", { id: toastId })
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled || isProcessing) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled && !isProcessing) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled || isProcessing) return
    onChange("")
    toast.success("Logo telah dikosongkan.")
  }

  const handleResetToDefault = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled || isProcessing) return
    onChange(defaultLogo)
    toast.success(`Logo dikembalikan ke bawaan sistem (${defaultLogo}).`)
  }

  const hasLogo = Boolean(value && value.trim().length > 0)
  const isBase64 = Boolean(value && value.startsWith("data:"))
  const isDefault = value === defaultLogo

  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label className="block text-sm font-semibold text-text-main">{label}</label>
          <button
            type="button"
            onClick={() => setShowManualInput(prev => !prev)}
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
          >
            <Link2 size={12} />
            {showManualInput ? "Sembunyikan URL manual" : "Input URL / Path manual"}
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={(e) => {
          const files = e.target.files
          if (files && files.length > 0) {
            handleFile(files[0])
          }
        }}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* Uploader Card */}
      {hasLogo ? (
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-bg border border-border rounded-xl transition-all">
          {/* Logo Thumbnail */}
          <div className="w-20 h-20 bg-surface rounded-lg border border-border/80 flex items-center justify-center p-2 relative flex-shrink-0 shadow-sm overflow-hidden group">
            {/* Checkerboard Pattern for transparent logos */}
            <div 
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: "radial-gradient(#94a3b8 0.75px, transparent 0.75px)",
                backgroundSize: "6px 6px"
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value || ""}
              alt="Logo"
              className="w-full h-full object-contain relative z-10"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none'
              }}
            />
          </div>

          {/* Info & Action Buttons */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              {isBase64 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Tersimpan di Database (Base64)
                </span>
              ) : isDefault ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Logo Default Sistem
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                  Logo Terpasang
                </span>
              )}
            </div>
            
            <p className="text-xs text-text-muted mt-1">
              {isBase64 
                ? "Tersimpan mandiri di database (bebas path & otomatis masuk saat backup)."
                : "Logo aktif pada kop surat dokumen cetak & PDF."}
            </p>

            <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-main bg-surface hover:bg-gray-50 border border-border rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-primary" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <RefreshCw size={13} />
                    Ganti Logo
                  </>
                )}
              </button>

              {!isDefault && defaultLogo && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={disabled || isProcessing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all disabled:opacity-50"
                  title="Kembalikan ke logo bawaan sistem"
                >
                  <RotateCcw size={13} />
                  Default Sistem
                </button>
              )}

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all disabled:opacity-50"
              >
                <Trash2 size={13} />
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.005]"
              : "border-border hover:border-primary/50 hover:bg-bg/50 bg-bg"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center text-center py-2">
              <Loader2 size={32} className="animate-spin text-primary mb-2" />
              <p className="text-sm font-semibold text-text-main">Sedang memproses & mengompresi logo...</p>
              <p className="text-xs text-text-muted mt-1">Harap tunggu sebentar</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-1">
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                <UploadCloud size={22} />
              </div>
              <p className="text-sm font-semibold text-text-main">
                Klik untuk unggah logo <span className="font-normal text-text-muted">atau drag & drop</span>
              </p>
              <p className="text-xs text-text-muted mt-1">
                PNG, JPG, WebP, SVG (Maks. 5MB). Otomatis dioptimasi dan disimpan ke database.
              </p>
              
              {defaultLogo && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="mt-3 text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Gunakan logo bawaan sistem ({defaultLogo})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Optional Manual URL Input Toggle */}
      {showManualInput && (
        <div className="pt-1.5 animate-in fade-in duration-200">
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Atau tempel path / URL logo eksternal..."
            className="w-full bg-bg border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-mono"
            disabled={disabled || isProcessing}
          />
          <p className="text-[11px] text-text-muted mt-1 italic">
            Mendukung Base64 Data URI (`data:image/...`), URL CDN eksternal (`https://...`), atau path lokal.
          </p>
        </div>
      )}

      {description && !hasLogo && (
        <p className="text-xs text-text-muted mt-1">{description}</p>
      )}
    </div>
  )
}

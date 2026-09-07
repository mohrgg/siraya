"use client"

import React, { useState, useRef } from "react"
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, Loader2, Link2 } from "lucide-react"
import toast from "react-hot-toast"

interface LogoUploaderProps {
  value?: string | null
  onChange: (url: string) => void
  label?: string
  description?: string
  folder?: string
  disabled?: boolean
  className?: string
}

export default function LogoUploader({
  value,
  onChange,
  label = "Logo Laporan & Dokumen",
  description = "Ditampilkan di sebelah kiri kop surat pada seluruh dokumen dan laporan.",
  folder = "logo",
  disabled = false,
  className = ""
}: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (disabled || isUploading) return

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      toast.error("Format file tidak didukung. Harap pilih gambar (PNG, JPG, WebP, SVG).")
      return
    }

    // Validasi ukuran (Maks. 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file melebihi batas maksimal 2MB.")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading("Mengunggah logo...")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || "Gagal mengunggah logo.")
      }

      onChange(data.url)
      toast.success("Logo berhasil diunggah!", { id: toastId })
    } catch (err: any) {
      console.error("Upload error:", err)
      toast.error(err.message || "Gagal mengunggah logo.", { id: toastId })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled || isUploading) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled || isUploading) return
    onChange("")
    toast.success("Logo telah dihapus.")
  }

  const hasLogo = Boolean(value && value.trim().length > 0)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label className="block text-sm font-semibold text-text-main">{label}</label>
          <button
            type="button"
            onClick={() => setShowManualInput(prev => !prev)}
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
          >
            <Link2 size={12} />
            {showManualInput ? "Sembunyikan URL manual" : "Input URL manual"}
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
        disabled={disabled || isUploading}
      />

      {/* Uploader Card */}
      {hasLogo ? (
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-bg border border-border rounded-xl transition-all">
          {/* Logo Thumbnail */}
          <div className="w-20 h-20 bg-surface rounded-lg border border-border/80 flex items-center justify-center p-2 relative flex-shrink-0 shadow-sm overflow-hidden group">
            {/* Checkerboard Pattern for transparent logos */}
            <div 
              className="absolute inset-0 opacity-20"
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
                // Fallback jika URL gagal di-load
                (e.target as HTMLElement).style.display = 'none'
              }}
            />
          </div>

          {/* Info & Action Buttons */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Logo Terpasang
              </span>
              <span className="text-xs text-text-muted truncate max-w-[200px]" title={value || ""}>
                {value}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Logo aktif dan akan muncul otomatis pada kop surat dokumen cetak & PDF.
            </p>

            <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-main bg-surface hover:bg-gray-50 border border-border rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-primary" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <RefreshCw size={13} />
                    Ganti Logo
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isUploading}
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
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.005]"
              : "border-border hover:border-primary/50 hover:bg-bg/50 bg-bg"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center text-center py-2">
              <Loader2 size={32} className="animate-spin text-primary mb-2" />
              <p className="text-sm font-semibold text-text-main">Sedang mengunggah logo...</p>
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
                PNG, JPG, WebP, atau SVG (Maks. 2MB). Disarankan berlatar transparan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Optional Manual URL Input Toggle */}
      {showManualInput && (
        <div className="pt-2 animate-in fade-in duration-200">
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Atau tempel path / URL logo eksternal..."
            className="w-full bg-bg border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main"
            disabled={disabled || isUploading}
          />
        </div>
      )}

      {description && !hasLogo && (
        <p className="text-xs text-text-muted mt-1">{description}</p>
      )}
    </div>
  )
}

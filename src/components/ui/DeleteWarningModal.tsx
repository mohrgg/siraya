"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ShieldAlert, Trash2, Info, Users, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/Button"

export interface DeleteDependencyItem {
  label: string
  count: number
  icon?: React.ReactNode
  variant?: "danger" | "warning" | "info"
}

export interface DeleteWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  isLoading?: boolean
  
  // Entity Info
  entityType: string // e.g. "Program / Jurusan", "Rombel Kelas", "Tingkatan Kelas", "Akun Keuangan", "Data Siswa"
  entityName: string // e.g. "Teknik Komputer & Jaringan", "X TKJ 1", "Ahmad Pratama"
  unitName?: string // e.g. "SMK Siraya"
  
  // Dependency / Blocking Status
  isBlocked: boolean // True jika ada murid/rombel/tagihan/transaksi aktif sehingga TIDAK boleh dihapus
  dependencies?: DeleteDependencyItem[] // e.g. [{ label: "Tagihan Aktif", count: 32 }]
  
  // Optional Direct Alternative Action on Blocked (e.g. Nonaktifkan Akun)
  secondaryAction?: {
    label: string
    onClick: () => void
    isLoading?: boolean
    icon?: React.ReactNode
  }

  // Custom texts (optional overrides)
  blockedTitle?: string
  blockedMessage?: string
  blockedSolution?: string
  
  confirmTitle?: string
  confirmMessage?: string
  confirmButtonText?: string
}

export function DeleteWarningModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  entityType,
  entityName,
  unitName,
  isBlocked,
  dependencies = [],
  secondaryAction,
  blockedTitle,
  blockedMessage,
  blockedSolution,
  confirmTitle,
  confirmMessage,
  confirmButtonText
}: DeleteWarningModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when modal is open
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose()
      }}
      aria-hidden="true"
    >
      <div 
        className="w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] relative z-10 pointer-events-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {isBlocked ? (
          /* ================= BLOCKED / WARNING POPUP ================= */
          <div className="flex flex-col">
            {/* Header: Sesuai standar Modal Siraya */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-bg/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldAlert size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-text-main m-0 leading-tight truncate">
                    {blockedTitle || `${entityType} Tidak Dapat Dihapus`}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                    <AlertTriangle size={12} /> Data memiliki keterkaitan aktif
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                disabled={isLoading}
                className="p-2 rounded-xl hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                type="button"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                {blockedMessage || `Sistem menolak penghapusan karena ${entityType.toLowerCase()} ini masih memiliki keterkaitan data aktif.`}
              </p>

              {/* Entity Details Card */}
              <div className="bg-bg/60 border border-border rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      {entityType}
                    </span>
                    <span className="text-sm font-bold text-text-main block">
                      {entityName}
                    </span>
                  </div>
                  {unitName && (
                    <span className="text-xs font-semibold text-text-muted bg-surface border border-border px-2.5 py-1 rounded-lg shrink-0">
                      {unitName}
                    </span>
                  )}
                </div>

                {/* Dependency Counts */}
                {dependencies.length > 0 && (
                  <div className="space-y-1.5 pt-0.5">
                    <span className="text-[11px] font-semibold text-text-muted block">
                      Keterkaitan yang masih aktif:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {dependencies.map((dep, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-xs"
                        >
                          <div className="flex items-center gap-2 text-text-main font-medium">
                            {dep.icon || <Users size={14} className="text-primary" />}
                            <span>{dep.label}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-xs border ${
                            dep.variant === "warning"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {dep.count} Aktif
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Solution Instruction Box */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex gap-2.5 text-xs text-blue-900 leading-relaxed">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-0.5">Solusi Pembersihan:</strong>
                  <span>
                    {blockedSolution || `Pindahkan atau hapus data terkait terlebih dahulu sebelum menghapus ${entityType.toLowerCase()} ini.`}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-surface flex flex-col-reverse sm:flex-row justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="w-full sm:w-auto font-semibold min-h-[44px] touch-manipulation"
              >
                Saya Mengerti &amp; Tutup
              </Button>
              {secondaryAction && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={secondaryAction.onClick}
                  isLoading={secondaryAction.isLoading}
                  className="w-full sm:w-auto font-bold flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation"
                >
                  {secondaryAction.icon}
                  <span>{secondaryAction.label}</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* ================= CONFIRMATION POPUP (CAN DELETE) ================= */
          <div className="flex flex-col">
            {/* Header: Sesuai standar Modal Siraya */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-bg/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
                  <Trash2 size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-text-main m-0 leading-tight truncate">
                    {confirmTitle || `Hapus ${entityType}?`}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 truncate">
                    Konfirmasi tindakan permanen
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                disabled={isLoading}
                className="p-2 rounded-xl hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                type="button"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                {confirmMessage || `Apakah Anda yakin ingin menghapus data ${entityType.toLowerCase()} ini? Data yang dihapus tidak dapat dipulihkan.`}
              </p>

              {/* Entity Details Card: Clean without debug text */}
              <div className="bg-bg/60 border border-border rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                    {entityType}
                  </span>
                  <span className="text-sm font-bold text-text-main block truncate">
                    {entityName}
                  </span>
                </div>
                {unitName && (
                  <span className="text-xs font-semibold text-text-muted bg-surface border border-border px-2.5 py-1 rounded-lg shrink-0">
                    {unitName}
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-surface flex flex-col-reverse sm:flex-row justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto font-semibold min-h-[44px] touch-manipulation"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={onConfirm}
                isLoading={isLoading}
                className="w-full sm:w-auto font-bold flex items-center justify-center gap-1.5 shadow-sm min-h-[44px] touch-manipulation"
              >
                <Trash2 size={16} />
                <span>{confirmButtonText || `Hapus ${entityType}`}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ShieldAlert, Trash2, Info, CheckCircle2, Users, Layers, AlertTriangle } from "lucide-react"
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
  entityType: string // e.g. "Program / Jurusan", "Rombel Kelas", "Tingkatan Kelas", "Akun Keuangan"
  entityName: string // e.g. "Teknik Komputer & Jaringan", "X TKJ 1", "4101 - SPP Bulanan"
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
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose()
      }}
    >
      <div 
        className="w-full max-w-md bg-surface p-6 rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {isBlocked ? (
          /* ================= BLOCKED / WARNING POPUP ================= */
          <div>
            {/* Warning Icon Badge */}
            <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 mb-4 shadow-xs">
              <ShieldAlert size={26} />
            </div>

            {/* Header Text */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md mb-1.5">
                <AlertTriangle size={12} /> Aksi Ditolak &bull; Data Terkunci
              </div>
              <h3 className="text-xl font-extrabold text-text-main tracking-tight">
                {blockedTitle || `${entityType} Tidak Dapat Dihapus`}
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {blockedMessage || `Sistem menolak penghapusan karena ${entityType.toLowerCase()} ini masih memiliki keterkaitan data aktif.`}
              </p>
            </div>

            {/* Entity Details Card */}
            <div className="bg-bg/80 border border-border rounded-xl p-3.5 mb-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                    {entityType}
                  </span>
                  <span className="text-sm font-extrabold text-text-main block">
                    {entityName}
                  </span>
                </div>
                {unitName && (
                  <span className="text-xs font-semibold text-text-muted bg-surface border border-border px-2 py-0.5 rounded-md shrink-0">
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
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex gap-2.5 text-xs text-blue-900 leading-relaxed mb-6">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-0.5">Solusi Pembersihan:</strong>
                <span>
                  {blockedSolution || `Pindahkan atau hapus siswa dan rombel terkait terlebih dahulu sebelum menghapus ${entityType.toLowerCase()} ini.`}
                </span>
              </div>
            </div>

            {/* Action Buttons for Blocked State */}
            <div className={`flex gap-3 ${secondaryAction ? "flex-col-reverse sm:flex-row justify-end" : "justify-end"}`}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className={`py-2.5 rounded-xl font-bold border-border hover:bg-gray-100 text-text-main shadow-xs ${secondaryAction ? "flex-1" : "w-full"}`}
              >
                Saya Mengerti &amp; Tutup
              </Button>
              {secondaryAction && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={secondaryAction.onClick}
                  isLoading={secondaryAction.isLoading}
                  className="flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {secondaryAction.icon}
                  <span>{secondaryAction.label}</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* ================= CONFIRMATION POPUP (CAN DELETE) ================= */
          <div>
            {/* Danger Icon Badge */}
            <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 mb-4 shadow-xs">
              <Trash2 size={24} />
            </div>

            {/* Header Text */}
            <div className="mb-4">
              <h3 className="text-xl font-extrabold text-text-main tracking-tight">
                {confirmTitle || `Hapus ${entityType}?`}
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {confirmMessage || `Apakah Anda yakin ingin menghapus ${entityType.toLowerCase()} ini? Data yang dihapus tidak dapat dipulihkan.`}
              </p>
            </div>

            {/* Entity Details Card */}
            <div className="bg-bg/80 border border-border rounded-xl p-3.5 mb-6 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                    {entityType}
                  </span>
                  <span className="text-sm font-extrabold text-text-main block">
                    {entityName}
                  </span>
                </div>
                {unitName && (
                  <span className="text-xs font-semibold text-text-muted bg-surface border border-border px-2 py-0.5 rounded-md shrink-0">
                    {unitName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold mt-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Bebas Keterikatan: 0 Riwayat Terkait (Aman Dihapus)</span>
              </div>
            </div>

            {/* Action Buttons: Cancel vs Danger Confirm */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl px-4 py-2 font-semibold"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={onConfirm}
                isLoading={isLoading}
                className="rounded-xl px-4 py-2 font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 size={15} />
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

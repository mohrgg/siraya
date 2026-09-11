"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  confirmText?: string
  cancelText?: string
  confirmVariant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
}

export function ConfirmModal({ 
  isOpen, title, message, onConfirm, onCancel, isLoading, 
  confirmText = "Hapus Data", cancelText = "Batal", confirmVariant = "danger" 
}: ConfirmModalProps) {
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

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onCancel()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isLoading, onCancel])

  if (!isOpen || !mounted) return null

  const isDanger = confirmVariant === "danger"
  const isPrimary = confirmVariant === "primary"

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel()
      }}
      aria-hidden="true"
    >
      <div 
        className="w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] relative z-10 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header: Konsisten dengan Standar Modal Siraya */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-border bg-bg/50 shrink-0 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isDanger 
                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                : isPrimary
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {isDanger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-text-main m-0 leading-tight truncate">
                {title}
              </h3>
              <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 truncate">
                Konfirmasi tindakan
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel} 
            disabled={isLoading}
            className="p-2 rounded-xl hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            type="button"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain">
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed m-0 whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Footer: Tombol Batal Netral vs Konfirmasi Solid */}
        <div className="p-3.5 sm:p-5 border-t border-border bg-surface flex flex-col-reverse sm:flex-row justify-end gap-2.5">
          <Button 
            variant="secondary" 
            onClick={onCancel} 
            disabled={isLoading} 
            className="w-full sm:w-auto font-semibold min-h-[44px] touch-manipulation"
          >
            {cancelText}
          </Button>
          <Button 
            variant={confirmVariant as any} 
            onClick={onConfirm} 
            isLoading={isLoading} 
            className="w-full sm:w-auto font-bold min-h-[44px] touch-manipulation"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

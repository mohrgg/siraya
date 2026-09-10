"use client"
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

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

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-surface p-5 sm:p-6 rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-150 max-h-[calc(100dvh-32px)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center gap-3.5 sm:gap-4 mb-4">
          <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-full shrink-0 ${confirmVariant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`}>
            <AlertTriangle size={22} />
          </div>
          <h3 className="m-0 text-lg sm:text-xl font-bold text-text-main leading-tight">{title}</h3>
        </div>
        
        <p className="text-text-muted text-xs sm:text-sm mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto min-h-[44px]">{cancelText}</Button>
          <Button variant={confirmVariant as any} onClick={onConfirm} isLoading={isLoading} className="w-full sm:w-auto min-h-[44px]">{confirmText}</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

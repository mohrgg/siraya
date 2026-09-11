"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: React.ElementType
  widthClassName?: string
  children: React.ReactNode
  footer?: React.ReactNode
  headerAction?: React.ReactNode
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  icon: Icon, 
  widthClassName = "max-w-lg", 
  children,
  footer,
  headerAction
}: ModalProps) {
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
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150" 
        onClick={onClose} 
        aria-hidden="true"
      />
      <div 
        className={`relative bg-surface rounded-2xl shadow-2xl w-full ${widthClassName} overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] z-10`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-border bg-bg/50 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {Icon && (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <Icon size={20} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-extrabold text-albas-green m-0 leading-tight truncate">{title}</h2>
              {subtitle && <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 leading-relaxed truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {headerAction}
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              type="button"
              aria-label="Tutup Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 min-h-0 p-3.5 sm:p-6 overflow-y-auto custom-scrollbar overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 p-3.5 sm:p-5 border-t border-border bg-surface/95 backdrop-blur-md flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

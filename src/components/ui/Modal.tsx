"use client"
import { X } from "lucide-react"
import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 short:p-2">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div 
        className={`relative bg-surface rounded-2xl shadow-2xl w-full ${widthClassName} overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[calc(100dvh-32px)] short:max-h-[calc(100dvh-12px)] z-10`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 short:py-2 short:px-3.5 border-b border-border bg-bg/50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {Icon && (
              <div className="w-10 h-10 short:w-7 short:h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <Icon size={20} className="short:w-4 short:h-4" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg short:text-sm font-extrabold text-albas-green m-0 leading-tight truncate">{title}</h2>
              {subtitle && <p className="text-[11px] sm:text-xs short:text-[10px] text-text-muted mt-0.5 leading-relaxed truncate sm:whitespace-normal">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            <button 
              onClick={onClose} 
              className="p-2 short:p-1.5 rounded-xl hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer"
              type="button"
              aria-label="Tutup"
            >
              <X size={20} className="short:w-4 short:h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 p-4 sm:p-6 short:p-3 overflow-y-auto custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 p-4 sm:p-5 short:py-2 short:px-3.5 border-t border-border bg-surface/95 backdrop-blur-md flex flex-col-reverse sm:flex-row short:flex-row items-center justify-end gap-2.5 sm:gap-3 short:gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

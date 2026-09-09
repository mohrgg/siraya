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

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl w-full ${widthClassName} overflow-hidden animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border-t sm:border border-border flex flex-col max-h-[85dvh] sm:max-h-[90vh]`}>
        {/* Mobile Drag Handle Indicator */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-bg/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <Icon size={20} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-albas-green m-0 leading-tight truncate">{title}</h2>
              {subtitle && <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 leading-relaxed truncate sm:whitespace-normal">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors shrink-0 cursor-pointer"
              type="button"
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className={`flex-1 min-h-0 p-4 sm:p-6 ${footer ? 'pb-6' : 'pb-28 sm:pb-6'} overflow-y-auto custom-scrollbar`}>
          {children}
        </div>
        {footer && (
          <div className="shrink-0 p-3.5 sm:p-5 border-t border-border bg-surface/95 backdrop-blur-md flex items-center justify-end gap-2.5 sm:gap-3 pb-24 sm:pb-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

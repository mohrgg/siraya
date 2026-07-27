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
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  icon: Icon, 
  widthClassName = "max-w-lg", 
  children 
}: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative bg-surface rounded-2xl shadow-2xl w-full ${widthClassName} overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-5 border-b border-border bg-bg/50 shrink-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <Icon size={20} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-extrabold text-albas-green m-0 leading-tight">{title}</h2>
              {subtitle && <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{subtitle}</p>}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors shrink-0"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}


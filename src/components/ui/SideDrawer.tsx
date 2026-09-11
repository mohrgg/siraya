"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface SideDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  widthClassName?: string
  onPrev?: () => void
  onNext?: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  headerExtra?: React.ReactNode
}

export function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  widthClassName = "max-w-3xl",
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  headerExtra
}: SideDrawerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when drawer is open
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
    <div className="fixed inset-0 z-[9990] overflow-hidden">
      {/* Backdrop with fade-in */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container: Full-Screen / Bottom Sheet on mobile, lateral slide on sm+ */}
      <div 
        className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto flex justify-end w-full max-w-full h-[100dvh] max-h-[100dvh] z-10 pointer-events-none"
      >
        <div 
          className={`w-full ${widthClassName} bg-white shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 ease-out sm:border-l border-gray-100 h-full max-h-[100dvh] overflow-hidden pointer-events-auto`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          
          {/* Header: Adaptif di Mobile (Ikon & Judul Tetap Muat & Tidak Terpotong) */}
          <div className="p-3 sm:p-5 bg-gradient-to-r from-emerald-50/70 via-white to-gray-50/70 border-b border-gray-100 flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {icon && (
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white text-primary border border-primary/20 shadow-xs flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {subtitle && (
                  <div className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-0.5 truncate">
                    {subtitle}
                  </div>
                )}
                <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight truncate leading-tight">
                  {title}
                </h2>
              </div>
            </div>

            {/* Aksi Header: Linear Navigation & Close Button */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {headerExtra}

              {(onPrev || onNext) && (
                <div className="flex items-center bg-gray-100/90 p-0.5 rounded-xl border border-gray-200/60">
                  {onPrev && (
                    <button
                      type="button"
                      onClick={onPrev}
                      disabled={prevDisabled}
                      title="Sebelumnya (Prev)"
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-none hover:shadow-xs min-h-[44px] min-w-[36px] sm:min-h-[36px] flex items-center justify-center touch-manipulation cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {onNext && (
                    <button
                      type="button"
                      onClick={onNext}
                      disabled={nextDisabled}
                      title="Berikutnya (Next)"
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-none hover:shadow-xs min-h-[44px] min-w-[36px] sm:min-h-[36px] flex items-center justify-center touch-manipulation cursor-pointer"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                title="Tutup Panel (ESC)"
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-4 sm:space-y-6 overscroll-contain">
            {children}
          </div>

          {/* Footer Responsif dengan Safe Area Dinamis (Bebas URL Bar / Gesture Bar) */}
          {footer && (
            <div className="p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 bg-gray-50/95 backdrop-blur-xs border-t border-gray-100 shrink-0">
              {footer}
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  )
}

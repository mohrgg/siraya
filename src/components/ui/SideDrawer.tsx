"use client"

import React, { useEffect } from "react"
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className={`w-screen ${widthClassName} bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out border-l border-gray-100`}>
          
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-50/80 via-white to-gray-50/80 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
              {icon && (
                <div className="w-12 h-12 rounded-xl bg-white text-primary border border-primary/20 shadow-xs flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {subtitle && (
                  <div className="text-xs font-semibold text-gray-500 mb-0.5 truncate">
                    {subtitle}
                  </div>
                )}
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                  {title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerExtra}

              {(onPrev || onNext) && (
                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 mr-2">
                  {onPrev && (
                    <button
                      onClick={onPrev}
                      disabled={prevDisabled}
                      title="Sebelumnya (Prev)"
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-none hover:shadow-xs"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {onNext && (
                    <button
                      onClick={onNext}
                      disabled={nextDisabled}
                      title="Berikutnya (Next)"
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-none hover:shadow-xs"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                title="Tutup Panel (ESC)"
                className="p-2.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
              {footer}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

"use client"

import React, { useState, useRef, useEffect } from "react"
import { Plus, Trash2, ChevronDown, Loader2 } from "lucide-react"
import { ConfirmModal } from "@/components/ui/ConfirmModal"

interface Option {
  id: string
  name: string
}

interface DynamicSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  onAdd: (name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
}

export function DynamicSelect({
  value,
  onChange,
  options,
  onAdd,
  onDelete,
  placeholder = "Pilih opsi...",
  disabled = false
}: DynamicSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newOptionName, setNewOptionName] = useState("")
  const [loadingAction, setLoadingAction] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Klik di luar untuk tutup dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsAdding(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.id === value)

  const handleAdd = async () => {
    if (!newOptionName.trim() || loadingAction) return

    setLoadingAction(true)
    try {
      await onAdd(newOptionName.trim())
      setNewOptionName("")
      setIsAdding(false)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (loadingAction) return
    setItemToDelete(id)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setLoadingAction(true)
    try {
      await onDelete(itemToDelete)
      if (value === itemToDelete) {
        onChange("") // Reset value jika yang dihapus sedang dipilih
      }
    } finally {
      setLoadingAction(false)
      setItemToDelete(null)
    }
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        className={`w-full px-4 py-2.5 bg-bg border rounded-xl flex items-center justify-between transition-all ${
          isOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-gray-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-sm font-medium ${!selectedOption ? "text-text-muted" : "text-text-main"}`}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-72">
          
          <div className="overflow-y-auto flex-1 p-1">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-xs text-center text-gray-500 italic">
                Belum ada opsi tersedia.
              </div>
            ) : (
              options.map(opt => (
                <div 
                  key={opt.id} 
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
                    value === opt.id ? "bg-primary/10 text-primary" : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onClick={() => {
                    onChange(opt.id)
                    setIsOpen(false)
                  }}
                >
                  <span className="text-sm font-medium">{opt.name}</span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, opt.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    title="Hapus opsi"
                  >
                    {loadingAction ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 p-2 bg-gray-50">
            {isAdding ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nama opsi baru..."
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  value={newOptionName}
                  onChange={e => setNewOptionName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loadingAction}
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newOptionName.trim() || loadingAction}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center min-w-[60px]"
                >
                  {loadingAction ? <Loader2 size={14} className="animate-spin" /> : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  disabled={loadingAction}
                  className="px-2 py-1.5 text-gray-500 hover:bg-gray-200 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsAdding(true)
                }}
              >
                <Plus size={14} />
                Tambah Opsi Baru
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        onCancel={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Opsi"
        message="Apakah Anda yakin ingin menghapus opsi ini?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isLoading={loadingAction}
      />
    </div>
  )
}

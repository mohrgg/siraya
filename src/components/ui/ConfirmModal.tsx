import React from 'react'
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
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface p-6 rounded-xl shadow-2xl border border-border">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-full ${confirmVariant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="m-0 text-xl font-bold text-text-main">{title}</h3>
        </div>
        
        <p className="text-text-muted mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>{cancelText}</Button>
          <Button variant={confirmVariant as any} onClick={onConfirm} isLoading={isLoading}>{confirmText}</Button>
        </div>
      </div>
    </div>
  )
}

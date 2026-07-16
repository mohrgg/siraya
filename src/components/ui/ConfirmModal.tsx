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
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="card" style={{ 
        width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-color)',
        padding: '1.5rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '50%', color: confirmVariant === 'danger' ? 'var(--text-error)' : 'var(--text-main)' }}>
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{title}</h3>
        </div>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>{cancelText}</Button>
          <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>{confirmText}</Button>
        </div>
      </div>
    </div>
  )
}

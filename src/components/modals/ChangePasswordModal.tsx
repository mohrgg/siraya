"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Eye, EyeOff, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import { gantiPasswordMandiri } from "@/actions/pengguna"
import { signOut } from "next-auth/react"

export default function ChangePasswordModal({
  isOpen, onClose
}: {
  isOpen: boolean, onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !mounted) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      return toast.error("Password baru minimal 6 karakter!")
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Konfirmasi password baru tidak cocok!")
    }
    try {
      setIsSubmitting(true)
      const res = await gantiPasswordMandiri(oldPassword, newPassword)
      toast.success("Password berhasil diubah! Sesi akan diakhiri untuk keamanan...")
      
      // Auto logout setelah berhasil
      setTimeout(() => {
        signOut({ callbackUrl: "/login" })
      }, 1500)
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah password")
      setIsSubmitting(false)
    }
  }

  const resetState = () => {
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setShowOld(false)
    setShowNew(false)
    setShowConfirm(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Ganti Password</h2>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Lama</label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Masukkan password lama"
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Ketik ulang password baru"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">Password tidak cocok!</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>Batal</Button>
            <Button type="submit" isLoading={isSubmitting} disabled={!oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}>
              Simpan Password
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

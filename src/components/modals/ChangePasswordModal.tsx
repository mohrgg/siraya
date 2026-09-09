"use client"

import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { Eye, EyeOff, X, KeyRound, Check, ShieldAlert, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import { gantiPasswordMandiri } from "@/actions/pengguna"
import { signOut } from "next-auth/react"

export default function ChangePasswordModal({
  isOpen, onClose, isMandatory = false
}: {
  isOpen: boolean
  onClose: () => void
  isMandatory?: boolean
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

  // Checklist kriteria keamanan
  const criteria = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumberOrSpecial: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
    }
  }, [newPassword])

  // Hitung skor kekuatan (0 - 4)
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "Belum diisi", color: "bg-gray-200", text: "text-gray-400" }
    let score = 0
    if (criteria.minLength) score++
    if (criteria.hasUpper) score++
    if (criteria.hasLower) score++
    if (criteria.hasNumberOrSpecial) score++

    switch (score) {
      case 1: return { score: 1, label: "Sangat Lemah", color: "bg-rose-500", text: "text-rose-600" }
      case 2: return { score: 2, label: "Lemah", color: "bg-amber-500", text: "text-amber-600" }
      case 3: return { score: 3, label: "Cukup", color: "bg-yellow-500", text: "text-yellow-600" }
      case 4: return { score: 4, label: "Kuat & Aman", color: "bg-emerald-500", text: "text-emerald-600" }
      default: return { score: 0, label: "Sangat Lemah", color: "bg-rose-500", text: "text-rose-600" }
    }
  }, [newPassword, criteria])

  if (!isOpen || !mounted) return null

  const isFormValid = criteria.minLength && criteria.hasUpper && criteria.hasLower && criteria.hasNumberOrSpecial && newPassword === confirmPassword && oldPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!criteria.minLength || !criteria.hasUpper || !criteria.hasLower || !criteria.hasNumberOrSpecial) {
      return toast.error("Password belum memenuhi seluruh kriteria keamanan!")
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Konfirmasi password baru tidak cocok!")
    }
    if (oldPassword === newPassword) {
      return toast.error("Password baru tidak boleh sama dengan password lama!")
    }

    try {
      setIsSubmitting(true)
      await gantiPasswordMandiri(oldPassword, newPassword)
      toast.success("Kata sandi berhasil diperbarui! Mengalihkan ke halaman login...", { icon: "🔒" })
      
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
    if (isMandatory) return
    resetState()
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={handleClose}
      ></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in duration-200 overflow-hidden border border-gray-100">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMandatory ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isMandatory ? "Wajib Perbarui Kata Sandi" : "Ganti Kata Sandi"}
              </h2>
              <p className="text-xs text-gray-500">
                {isMandatory ? "Untuk keamanan sistem, perbarui kata sandi default Anda sebelum melanjutkan." : "Perbarui kata sandi secara berkala untuk menjaga keamanan akun."}
              </p>
            </div>
          </div>
          {!isMandatory && (
            <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        {isMandatory && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 leading-relaxed">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Perhatian Keamanan:</strong> Akun Anda terdeteksi menggunakan kata sandi awal atau telah direset oleh Administrator. Anda wajib membuat kata sandi baru yang unik dan kuat untuk mengakses dasbor.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Kata Sandi Saat Ini</label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder={isMandatory ? "Masukkan sandi awal (cth: albas123)" : "Masukkan kata sandi lama Anda"}
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimal 8 karakter"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Konfirmasi Sandi Baru</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!newPassword}
                  placeholder="Ketik ulang sandi baru"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} disabled={!newPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-40">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Strength Bar & Criteria Checklist */}
          {newPassword && (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Kekuatan Sandi: <strong className={strength.text}>{strength.label}</strong></span>
                {confirmPassword && (
                  newPassword === confirmPassword ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Check size={12} /> Cocok
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold">Belum cocok</span>
                  )
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                <div className={`h-full rounded-full transition-all ${strength.score >= 1 ? strength.color : "bg-gray-200"}`}></div>
                <div className={`h-full rounded-full transition-all ${strength.score >= 2 ? strength.color : "bg-gray-200"}`}></div>
                <div className={`h-full rounded-full transition-all ${strength.score >= 3 ? strength.color : "bg-gray-200"}`}></div>
                <div className={`h-full rounded-full transition-all ${strength.score >= 4 ? strength.color : "bg-gray-200"}`}></div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${criteria.minLength ? "text-emerald-700 font-semibold" : "text-gray-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${criteria.minLength ? "bg-emerald-600" : "bg-gray-300"}`}></span>
                  Minimal 8 karakter
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasUpper ? "text-emerald-700 font-semibold" : "text-gray-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${criteria.hasUpper ? "bg-emerald-600" : "bg-gray-300"}`}></span>
                  Huruf kapital (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasLower ? "text-emerald-700 font-semibold" : "text-gray-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${criteria.hasLower ? "bg-emerald-600" : "bg-gray-300"}`}></span>
                  Huruf kecil (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasNumberOrSpecial ? "text-emerald-700 font-semibold" : "text-gray-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${criteria.hasNumberOrSpecial ? "bg-emerald-600" : "bg-gray-300"}`}></span>
                  Angka atau simbol
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            {!isMandatory && (
              <Button type="button" variant="outline" onClick={handleClose}>Batal</Button>
            )}
            <Button 
              type="submit" 
              isLoading={isSubmitting} 
              disabled={!isFormValid || isSubmitting}
              className={isMandatory ? "w-full sm:w-auto" : ""}
            >
              Simpan Kata Sandi Baru
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { 
  User, KeyRound, X, Check, ShieldAlert, Eye, EyeOff, 
  Building2, Mail, Shield, Save, CheckCircle2, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import toast from "react-hot-toast"
import { updateProfilMandiri, gantiPasswordMandiri, getProfilMandiri } from "@/actions/pengguna"
import { formatDisplayName, formatRoleLabel, getRoleBadgeStyle } from "@/lib/helpers/user"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface ManageAccountModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "profile" | "password"
  onProfileUpdated?: (updatedUser: any) => void
}

export function ManageAccountModal({
  isOpen,
  onClose,
  initialTab = "profile",
  onProfileUpdated
}: ManageAccountModalProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const [activeTab, setActiveTab] = useState<"profile" | "password">(initialTab)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Profile Form State
  const [fullName, setFullName] = useState("")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password Form State
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      loadProfileData()
    }
  }, [isOpen, initialTab])

  const loadProfileData = async () => {
    try {
      setIsLoadingProfile(true)
      const data = await getProfilMandiri()
      setUserProfile(data)
      setFullName(data.name || "")
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Password strength logic
  const criteria = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumberOrSpecial: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
    }
  }, [newPassword])

  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "Belum diisi", color: "bg-gray-200 dark:bg-slate-700", text: "text-gray-400" }
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = fullName.trim()
    if (!clean || clean.length < 2) {
      return toast.error("Nama lengkap minimal terdiri dari 2 karakter.")
    }

    try {
      setIsUpdatingProfile(true)
      const res = await updateProfilMandiri({ name: clean })

      toast.success("Nama profil berhasil diperbarui!")
      if (userProfile) {
        setUserProfile({ ...userProfile, name: res.name })
      }
      onProfileUpdated?.(res)
      router.refresh()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui profil")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
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
      setIsSubmittingPassword(true)
      await gantiPasswordMandiri(oldPassword, newPassword)
      toast.success("Kata sandi berhasil diperbarui! Mengalihkan ke halaman login...")
      
      setTimeout(async () => {
        await signOut({ redirect: false })
        window.location.href = "/login"
      }, 1500)
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah kata sandi")
      setIsSubmittingPassword(false)
    }
  }

  if (!isOpen || !mounted) return null

  const getInitials = (str: string) => {
    return str
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "U"
  }

  const displayName = formatDisplayName(userProfile?.name)
  const roleName = formatRoleLabel(userProfile?.role)
  const roleBadgeClass = getRoleBadgeStyle(userProfile?.role)

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-border flex flex-col max-h-[calc(100dvh-24px)]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-main m-0 leading-tight">
                Manajemen Akun Saya
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Kelola profil identitas dan keamanan akun login Anda
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-bg/30 px-5 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            <User size={16} />
            <span>Profil Saya</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "password"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            <KeyRound size={16} />
            <span>Keamanan & Sandi</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Profile Card Summary */}
              <div className="p-4 bg-bg rounded-xl border border-border flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-lg font-extrabold shrink-0 border border-primary/20">
                  {userProfile?.avatar ? (
                    <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span>{getInitials(displayName)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-text-main truncate">
                      {displayName}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleBadgeClass}`}>
                      {roleName}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted flex items-center gap-1.5 mt-1 truncate">
                    <Mail size={13} className="shrink-0" />
                    <span className="truncate">{userProfile?.email || "-"}</span>
                  </p>
                </div>
              </div>

              {/* Form Input Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">
                  Nama Lengkap / Nama Tampilan
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda..."
                  required
                  disabled={isUpdatingProfile || isLoadingProfile}
                />
                <p className="text-[11px] text-text-muted">
                  Nama ini akan ditampilkan pada Sidebar, Header, dan berkas tanda tangan dokumen transaksi yang Anda buat.
                </p>
              </div>

              {/* Info Detail Akun */}
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-bold text-text-main">Informasi Penugasan & Sistem</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 bg-bg/50 rounded-lg border border-border">
                    <span className="text-text-muted block text-[11px]">Unit Sekolah</span>
                    <span className="font-semibold text-text-main flex items-center gap-1.5 mt-0.5">
                      <Building2 size={13} className="text-primary shrink-0" />
                      <span className="truncate">
                        {userProfile?.unitSekolah?.name || (userProfile?.role === "ADMIN" || userProfile?.role === "YAYASAN" ? "Akses Seluruh Unit (Yayasan)" : "-")}
                      </span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-bg/50 rounded-lg border border-border">
                    <span className="text-text-muted block text-[11px]">Status Akun</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 size={13} className="shrink-0" />
                      <span>Aktif & Terverifikasi</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Tombol Simpan */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isUpdatingProfile}>
                  Tutup
                </Button>
                <Button type="submit" size="sm" isLoading={isUpdatingProfile} disabled={isUpdatingProfile}>
                  <Save size={15} className="mr-1.5" />
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Field Password Lama */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Kata Sandi Lama</label>
                <div className="relative">
                  <Input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan kata sandi saat ini"
                    required
                    className="pr-10"
                    disabled={isSubmittingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main cursor-pointer"
                  >
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Field Password Baru */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Kata Sandi Baru</label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter (huruf, angka, simbol)"
                    required
                    className="pr-10"
                    disabled={isSubmittingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main cursor-pointer"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength Meter */}
                {newPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-text-muted">Kekuatan Sandi:</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 transition-all duration-300 rounded-full ${
                            step <= strength.score ? strength.color : "bg-border/60"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Field Konfirmasi Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    required
                    className="pr-10"
                    disabled={isSubmittingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main cursor-pointer"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Checklist Syarat Keamanan */}
              <div className="p-3 bg-bg rounded-xl border border-border space-y-1.5 text-xs">
                <span className="font-semibold text-text-main block mb-1">Kriteria Keamanan Kata Sandi:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${criteria.minLength ? "text-emerald-600 font-medium" : "text-text-muted"}`}>
                    <Check size={13} className={criteria.minLength ? "opacity-100" : "opacity-30"} />
                    <span>Minimal 8 karakter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${criteria.hasUpper ? "text-emerald-600 font-medium" : "text-text-muted"}`}>
                    <Check size={13} className={criteria.hasUpper ? "opacity-100" : "opacity-30"} />
                    <span>Minimal 1 huruf kapital</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${criteria.hasLower ? "text-emerald-600 font-medium" : "text-text-muted"}`}>
                    <Check size={13} className={criteria.hasLower ? "opacity-100" : "opacity-30"} />
                    <span>Minimal 1 huruf kecil</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${criteria.hasNumberOrSpecial ? "text-emerald-600 font-medium" : "text-text-muted"}`}>
                    <Check size={13} className={criteria.hasNumberOrSpecial ? "opacity-100" : "opacity-30"} />
                    <span>Angka atau karakter simbol</span>
                  </div>
                </div>
              </div>

              {/* Tombol Simpan Sandi */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmittingPassword}>
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  isLoading={isSubmittingPassword} 
                  disabled={isSubmittingPassword || !oldPassword || !newPassword || newPassword !== confirmPassword || strength.score < 3}
                >
                  <KeyRound size={15} className="mr-1.5" />
                  Perbarui Kata Sandi
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ManageAccountModal

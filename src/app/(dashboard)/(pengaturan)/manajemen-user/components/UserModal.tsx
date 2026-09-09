import { useState, useMemo } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { UserCheck, Eye, EyeOff, Sparkles, Copy, Check, ShieldAlert, KeyRound } from "lucide-react"
import toast from "react-hot-toast"

export default function UserModal({ 
  showUserModal, setShowUserModal, 
  formUser, setFormUser, 
  handleSubmitUser, isSubmitting, 
  units, divisis 
}: any) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [copied, setCopied] = useState(false)

  // Hitung skor kekuatan kata sandi (0 - 4)
  const passwordStrength = useMemo(() => {
    const pwd = formUser.password || ""
    if (!pwd) return { score: 0, label: "Belum diisi", color: "bg-gray-200" }

    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[a-z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd) || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score += 1

    switch (score) {
      case 1:
        return { score: 1, label: "Sangat Lemah", color: "bg-rose-500", text: "text-rose-600" }
      case 2:
        return { score: 2, label: "Lemah", color: "bg-amber-500", text: "text-amber-600" }
      case 3:
        return { score: 3, label: "Cukup", color: "bg-yellow-500", text: "text-yellow-600" }
      case 4:
        return { score: 4, label: "Kuat & Aman", color: "bg-emerald-500", text: "text-emerald-600" }
      default:
        return { score: 0, label: "Sangat Lemah", color: "bg-rose-500", text: "text-rose-600" }
    }
  }, [formUser.password])

  // Generator Password Aman 12 Karakter
  const handleGeneratePassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    const lower = "abcdefghijkmnopqrstuvwxyz"
    const digits = "23456789"
    const symbols = "!@#$%&*?"
    const all = upper + lower + digits + symbols

    let generated = ""
    generated += upper[Math.floor(Math.random() * upper.length)]
    generated += lower[Math.floor(Math.random() * lower.length)]
    generated += digits[Math.floor(Math.random() * digits.length)]
    generated += symbols[Math.floor(Math.random() * symbols.length)]

    for (let i = 4; i < 12; i++) {
      generated += all[Math.floor(Math.random() * all.length)]
    }

    // Shuffle
    generated = generated.split("").sort(() => Math.random() - 0.5).join("")

    setFormUser({ ...formUser, password: generated })
    setConfirmPassword(generated)
    setShowPassword(true)
    setShowConfirmPassword(true)

    // Salin otomatis ke clipboard
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Password aman dibuat & disalin ke clipboard!")
  }

  const handleCopyPassword = () => {
    if (!formUser.password) return
    navigator.clipboard.writeText(formUser.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Password disalin ke clipboard!")
  }

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validasi konfirmasi password jika password diisi
    if (formUser.password && formUser.password !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok!")
      return
    }

    // Jika membuat user baru dan password kustom diisi (bukan default albas123)
    if (formUser.password && formUser.password !== "albas123" && passwordStrength.score < 3) {
      toast.error("Kata sandi terlalu lemah! Minimal 8 karakter dengan huruf kapital, angka/simbol.")
      return
    }

    handleSubmitUser(e)
  }

  return (
    <Modal
      isOpen={showUserModal}
      onClose={() => setShowUserModal(false)}
      title={formUser.id ? "Edit Pengguna" : "Tambah Pengguna Baru"}
      subtitle="Atur hak akses login, unit penugasan, dan pengaturan keamanan akun"
      icon={UserCheck}
      widthClassName="max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => setShowUserModal(false)}>Batal</Button>
          <Button type="submit" form="form-user" isLoading={isSubmitting}>Simpan Pengguna</Button>
        </>
      }
    >
      <form id="form-user" onSubmit={onFormSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Nama Lengkap <span className="text-red-500">*</span></label>
            <Input value={formUser.name} onChange={e => setFormUser({...formUser, name: e.target.value})} required placeholder="cth: Ahmad Fauzi" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Email (Login) <span className="text-red-500">*</span></label>
            <Input type="email" value={formUser.email} onChange={e => setFormUser({...formUser, email: e.target.value})} required placeholder="nama@albasyariah.com" />
          </div>
        </div>

        {/* SECURITY & PASSWORD SECTION */}
        <div className="p-4 bg-bg border border-border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <KeyRound size={15} className="text-primary" />
              {formUser.id ? "Ganti Kata Sandi" : "Setel Kata Sandi"}
              {formUser.id && <span className="text-text-muted font-normal text-xs">(Kosongkan jika tetap)</span>}
            </label>
            
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20"
              title="Buat password acak yang kuat otomatis"
            >
              <Sparkles size={13} />
              Buat Sandi Kuat
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formUser.password}
                onChange={e => setFormUser({...formUser, password: e.target.value})}
                placeholder={formUser.id ? "Biarkan kosong..." : "albas123 (Default)"}
                className="w-full px-3.5 py-2.5 pr-16 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono text-text-main placeholder-text-muted/50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {formUser.password && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-1 text-text-muted hover:text-text-main rounded transition-colors"
                    title="Salin password"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-text-muted hover:text-text-main rounded transition-colors"
                  title={showPassword ? "Sembunyikan" : "Tampilkan"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi kata sandi..."
                disabled={!formUser.password}
                className="w-full px-3.5 py-2.5 pr-9 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono text-text-main placeholder-text-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={!formUser.password}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main disabled:opacity-50"
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* PASSWORD STRENGTH BAR & MATCH INDICATOR */}
          {formUser.password && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Kekuatan Sandi: <strong className={passwordStrength.text}>{passwordStrength.label}</strong></span>
                {confirmPassword && (
                  formUser.password === confirmPassword ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <Check size={12} /> Cocok
                    </span>
                  ) : (
                    <span className="text-rose-600 font-medium">Belum cocok</span>
                  )
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : "bg-gray-200"}`}></div>
                <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : "bg-gray-200"}`}></div>
                <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : "bg-gray-200"}`}></div>
                <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 4 ? passwordStrength.color : "bg-gray-200"}`}></div>
              </div>
              <p className="text-[11px] text-text-muted leading-tight">
                Disarankan minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, dan angka/simbol.
              </p>
            </div>
          )}

          {/* CHECKBOX WAJIB GANTI PASSWORD SAAT LOGIN PERTAMA */}
          <div className="pt-2 border-t border-border flex items-start gap-2">
            <input
              type="checkbox"
              id="mustChangePassword"
              checked={formUser.mustChangePassword !== false}
              onChange={e => setFormUser({ ...formUser, mustChangePassword: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-primary rounded border-border focus:ring-primary"
            />
            <label htmlFor="mustChangePassword" className="text-xs text-text-main cursor-pointer leading-tight">
              <span className="font-semibold block">Wajibkan ganti kata sandi saat login pertama kali</span>
              <span className="text-text-muted text-[11px]">Pengguna akan langsung diminta membuat kata sandi baru saat pertama kali masuk sistem.</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Role Akses <span className="text-red-500">*</span></label>
          <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formUser.role} onChange={e => setFormUser({...formUser, role: e.target.value})}>
            <option value="TATA_USAHA">TATA USAHA (Operasional Kas/Tagihan)</option>
            <option value="ADMIN">ADMIN (Full System Config)</option>
            <option value="KEPALA_SEKOLAH">KEPALA SEKOLAH (Laporan Saja)</option>
            <option value="YAYASAN">PENGURUS YAYASAN (Pengawasan 360° Global)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">
            Akses Unit Sekolah
            {formUser.role !== "ADMIN" && formUser.role !== "YAYASAN" && <span className="text-red-500"> *</span>}
          </label>
          <select 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" 
            value={formUser.unitSekolahId} 
            onChange={e => setFormUser({...formUser, unitSekolahId: e.target.value})}
            required={formUser.role !== "ADMIN" && formUser.role !== "YAYASAN"}
          >
            <option value="">-- {formUser.role === "ADMIN" || formUser.role === "YAYASAN" ? "AKSES GLOBAL (SEMUA UNIT)" : "Pilih Unit Sekolah"} --</option>
            {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <p className="text-xs text-text-muted">
            {formUser.role !== "ADMIN" && formUser.role !== "YAYASAN" ? "Wajib diisi untuk membatasi hak akses data." : "Kosongkan jika ingin memberi akses semua sekolah."}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Divisi</label>
          <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formUser.divisiId} onChange={e => setFormUser({...formUser, divisiId: e.target.value})}>
            <option value="">-- Tanpa Divisi --</option>
            {divisis.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {formUser.id && (
          <div className="flex items-center gap-2 mt-1">
            <input type="checkbox" id="isActive" checked={formUser.isActive} onChange={e => setFormUser({...formUser, isActive: e.target.checked})} className="w-4 h-4 text-primary rounded" />
            <label htmlFor="isActive" className="text-sm font-medium text-text-main cursor-pointer">Akun Aktif (Bisa Login)</label>
          </div>
        )}
      </form>
    </Modal>
  )
}

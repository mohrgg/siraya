import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { UserCheck } from "lucide-react"

export default function UserModal({ 
  showUserModal, setShowUserModal, 
  formUser, setFormUser, 
  handleSubmitUser, isSubmitting, 
  units, divisis 
}: any) {
  return (
    <Modal
      isOpen={showUserModal}
      onClose={() => setShowUserModal(false)}
      title={formUser.id ? "Edit Pengguna" : "Tambah Pengguna Baru"}
      subtitle="Atur hak akses login, unit penugasan, dan divisi staf"
      icon={UserCheck}
      widthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmitUser} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Nama Lengkap <span className="text-red-500">*</span></label>
            <Input value={formUser.name} onChange={e => setFormUser({...formUser, name: e.target.value})} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Email (Login) <span className="text-red-500">*</span></label>
            <Input type="email" value={formUser.email} onChange={e => setFormUser({...formUser, email: e.target.value})} required />
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Setel Password <span className="text-text-muted font-normal text-xs">(Kosongkan jika tidak ingin diubah)</span></label>
          <Input type="password" value={formUser.password} onChange={e => setFormUser({...formUser, password: e.target.value})} placeholder={formUser.id ? "********" : "albas123 (Default)"} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Role Akses <span className="text-red-500">*</span></label>
          <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formUser.role} onChange={e => setFormUser({...formUser, role: e.target.value})}>
            <option value="TATA_USAHA">TATA USAHA (Operasional Kas/Tagihan)</option>
            <option value="ADMIN">ADMIN (Full System Config)</option>
            <option value="KEPALA_SEKOLAH">KEPALA SEKOLAH (Laporan Saja)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">
            Akses Unit Sekolah
            {formUser.role !== "ADMIN" && <span className="text-red-500"> *</span>}
          </label>
          <select 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" 
            value={formUser.unitSekolahId} 
            onChange={e => setFormUser({...formUser, unitSekolahId: e.target.value})}
            required={formUser.role !== "ADMIN"}
          >
            <option value="">-- {formUser.role === "ADMIN" ? "AKSES GLOBAL (SEMUA UNIT)" : "Pilih Unit Sekolah"} --</option>
            {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <p className="text-xs text-text-muted">
            {formUser.role !== "ADMIN" ? "Wajib diisi untuk membatasi hak akses data." : "Kosongkan jika ingin memberi akses semua sekolah."}
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
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="isActive" checked={formUser.isActive} onChange={e => setFormUser({...formUser, isActive: e.target.checked})} className="w-4 h-4 text-primary" />
            <label htmlFor="isActive" className="text-sm font-medium text-text-main">Akun Aktif (Bisa Login)</label>
          </div>
        )}

        <div className="flex gap-3 mt-4 justify-end">
          <Button type="button" variant="outline" onClick={() => setShowUserModal(false)}>Batal</Button>
          <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
        </div>
      </form>
    </Modal>
  )
}

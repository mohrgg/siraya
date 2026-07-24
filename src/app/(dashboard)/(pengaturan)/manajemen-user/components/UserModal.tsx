import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

export default function UserModal({ 
  showUserModal, setShowUserModal, 
  formUser, setFormUser, 
  handleSubmitUser, isSubmitting, 
  units, divisis 
}: any) {
  if (!showUserModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <form onSubmit={handleSubmitUser} className="w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-lg">{formUser.id ? "Edit" : "Tambah"} Pengguna</h3>
        </div>
        <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
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
            <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formUser.role} onChange={e => setFormUser({...formUser, role: e.target.value})}>
              <option value="TATA_USAHA">TATA USAHA (Operasional Kas/Tagihan)</option>
              <option value="ADMIN">ADMIN (Full System Config)</option>
              <option value="KEPALA_SEKOLAH">KEPALA SEKOLAH (Laporan Saja)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Akses Unit Sekolah</label>
            <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formUser.unitSekolahId} onChange={e => setFormUser({...formUser, unitSekolahId: e.target.value})}>
              <option value="">-- AKSES GLOBAL (SEMUA UNIT) --</option>
              {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <p className="text-xs text-text-muted">Pilih unit jika staf hanya boleh mengurus 1 sekolah.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Divisi</label>
            <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formUser.divisiId} onChange={e => setFormUser({...formUser, divisiId: e.target.value})}>
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
        </div>
        <div className="p-4 border-t border-border flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => setShowUserModal(false)}>Batal</Button>
          <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
        </div>
      </form>
    </div>
  )
}

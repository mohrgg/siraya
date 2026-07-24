import { Users, Edit2, Key, XCircle, ShieldCheck, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function UserList({ 
  filteredUsers, 
  searchQuery, setSearchQuery, 
  filterRole, setFilterRole, 
  filterUnit, setFilterUnit, 
  units, openAddUser, openEditUser, 
  setResetUserId, setDisableUserId 
}: any) {
  
  const roleBadge = (role: string) => {
    switch(role) {
      case "ADMIN": return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 w-max"><ShieldCheck size={12} /> SUPER ADMIN</span>
      case "TATA_USAHA": return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-bold w-max">TATA USAHA</span>
      case "KEPALA_SEKOLAH": return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg text-xs font-bold w-max">KEPALA SEKOLAH</span>
      default: return <span>{role}</span>
    }
  }

  return (
    <div className="bg-surface/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-gradient-to-r from-bg/50 to-transparent">
        <h2 className="font-bold text-text-main shrink-0 text-xl flex items-center gap-2">
          <Users className="text-primary" /> Pengguna Sistem
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="text" 
            placeholder="Cari nama/email..." 
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-primary focus:ring-2 focus:ring-primary/20 w-64 shadow-sm transition-all" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
          <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm shadow-sm" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">Semua Role</option>
            <option value="ADMIN">ADMIN</option>
            <option value="TATA_USAHA">TATA_USAHA</option>
            <option value="KEPALA_SEKOLAH">KEPALA_SEKOLAH</option>
          </select>
          <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm shadow-sm" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
            <option value="">Semua Unit</option>
            <option value="GLOBAL">Global (Semua)</option>
            {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <Button onClick={openAddUser} className="rounded-xl shadow-md"><Plus size={18} className="mr-1.5" /> Tambah Pengguna</Button>
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-bg/30">
        {filteredUsers.length > 0 ? filteredUsers.map((u: any) => (
          <div key={u.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shadow-sm">
                  {u.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-text-main text-base group-hover:text-primary transition-colors">{u.name}</h3>
                  <p className="text-text-muted text-xs font-medium">{u.email}</p>
                </div>
              </div>
              {u.isActive ? (
                <div className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold border border-emerald-200">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Aktif
                </div>
              ) : (
                <div className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold border border-red-100">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Nonaktif
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Role</span>
                <span>{roleBadge(u.role)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Penugasan</span>
                {u.unitSekolahId ? (
                  <span className="font-semibold text-text-main">{u.unitSekolah?.name}</span>
                ) : (
                  <span className="font-bold text-amber-600">Semua Unit (Global)</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Divisi</span>
                <span className="font-semibold text-text-main">{u.divisi?.name || "-"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <button onClick={() => openEditUser(u)} className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-sm py-2 rounded-xl transition-colors flex justify-center items-center gap-2">
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={() => setResetUserId(u.id)} className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors" title="Reset Password">
                <Key size={16} />
              </button>
              {u.isActive && (
                <button onClick={() => setDisableUserId(u.id)} className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors" title="Nonaktifkan Akun">
                  <XCircle size={16} />
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <Users size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-text-main">Tidak ada pengguna</h3>
            <p className="text-text-muted text-sm mt-1">Coba ubah kriteria pencarian atau filter Anda.</p>
          </div>
        )}
      </div>
    </div>
  )
}

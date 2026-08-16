import { Users, Edit2, Key, XCircle, ShieldCheck, Search, Filter } from "lucide-react"
import { Toolbar, ToolbarSearch, ToolbarFilter, ToolbarActions, ToolbarAddButton } from "@/components/ui/DataTableToolbar"

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
    <div className="flex flex-col">
      <div className="p-6 bg-white">
        <Toolbar>
          <ToolbarSearch 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Cari nama atau email..." 
          />
          <ToolbarFilter
            icon={<Filter size={14} />}
            value={filterRole}
            onChange={(val) => setFilterRole(val as string)}
            options={[
              { label: "Semua Role", value: "" },
              { label: "ADMIN", value: "ADMIN" },
              { label: "TATA_USAHA", value: "TATA_USAHA" },
              { label: "KEPALA_SEKOLAH", value: "KEPALA_SEKOLAH" }
            ]}
          />
          <ToolbarFilter
            icon={<Filter size={14} />}
            value={filterUnit}
            onChange={(val) => setFilterUnit(val as string)}
            options={[
              { label: "Semua Unit", value: "" },
              { label: "Global (Semua)", value: "GLOBAL" },
              ...units.map((u: any) => ({ label: u.name, value: u.id }))
            ]}
          />
          <ToolbarActions>
            <ToolbarAddButton onClick={openAddUser}>
              Tambah Pengguna
            </ToolbarAddButton>
          </ToolbarActions>
        </Toolbar>
      </div>
      
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <th className="px-6 py-4">Pengguna</th>
              <th className="px-6 py-4">Akses & Penugasan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 shadow-sm shrink-0">
                        {u.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{u.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      {roleBadge(u.role)}
                      {u.unitSekolahId ? (
                        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                          {u.unitSekolah?.name}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Global (Semua Unit)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.isActive ? (
                      <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold w-max border border-emerald-100">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Aktif
                      </div>
                    ) : (
                      <div className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold w-max border border-red-100">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Nonaktif
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditUser(u)} 
                        className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition-colors" 
                        title="Edit Pengguna"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setResetUserId(u.id)} 
                        className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-colors" 
                        title="Reset Password"
                      >
                        <Key size={16} />
                      </button>
                      {u.isActive && (
                        <button 
                          onClick={() => setDisableUserId(u.id)} 
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors" 
                          title="Nonaktifkan Akun"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Users size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Tidak ada pengguna</h3>
                    <p className="text-gray-500 text-sm mt-1">Coba ubah kriteria pencarian atau filter Anda.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { Users, UserX, Edit2, Key, XCircle, CheckCircle2, Trash2, ShieldCheck, Filter, Lock, Unlock, KeyRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { Toolbar, ToolbarSearch, ToolbarFilter, ToolbarActions, ToolbarRefreshButton, ToolbarAddButton } from "@/components/ui/DataTableToolbar"
import { useSortableData } from "@/hooks/useSortableData"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { TableScrollHint } from "@/components/ui/TableScrollHint"

export default function UserList({ 
  filteredUsers, 
  searchQuery, setSearchQuery, 
  filterRole, setFilterRole, 
  filterUnit, setFilterUnit, 
  units, openAddUser, openEditUser, 
  setResetUserId, setDisableUserId,
  setUnlockUserId,
  isInactiveTab = false,
  setActivateUserId,
  setDeleteUserId
}: any) {
  const router = useRouter()
  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredUsers, { key: "role", direction: "asc" })

  const roleBadge = (role: string) => {
    switch(role) {
      case "ADMIN": return <span className="text-rose-600 text-xs font-bold flex items-center gap-1 w-max"><ShieldCheck size={12} /> SUPER ADMIN</span>
      case "TATA_USAHA": return <span className="text-blue-600 text-xs font-bold w-max">TATA USAHA</span>
      case "KEPALA_SEKOLAH": return <span className="text-purple-600 text-xs font-bold w-max">KEPALA SEKOLAH</span>
      case "YAYASAN": return <span className="text-[#065f32] text-xs font-bold w-max">PENGURUS YAYASAN</span>
      default: return <span className="text-text-main text-xs font-bold w-max">{role}</span>
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <Toolbar>
          <ToolbarSearch 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Cari nama atau email..." 
          />
          <div className="grid grid-cols-2 sm:flex gap-2.5 w-full sm:w-auto">
            <ToolbarFilter
              icon={<Filter size={14} />}
              value={filterRole}
              onChange={(val) => setFilterRole(val as string)}
              options={[
                { label: "Semua Role", value: "" },
                { label: "ADMIN", value: "ADMIN" },
                { label: "TATA_USAHA", value: "TATA_USAHA" },
                { label: "KEPALA_SEKOLAH", value: "KEPALA_SEKOLAH" },
                { label: "YAYASAN", value: "YAYASAN" }
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
          </div>
          <ToolbarActions>
            <ToolbarRefreshButton onClick={() => router.refresh()} title="Segarkan Data" />
            {!isInactiveTab && (
              <ToolbarAddButton onClick={openAddUser}>
                Tambah Pengguna
              </ToolbarAddButton>
            )}
          </ToolbarActions>
        </Toolbar>
      </div>
      
      <TableScrollHint totalRows={sortedData.length} />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
          <thead className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 font-semibold text-center w-12">NO</th>
              <SortableHeader label="PENGGUNA" sortKey="name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-left" />
              <SortableHeader label="AKSES & PENUGASAN" sortKey="role" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-left" />
              <SortableHeader label="STATUS KEAMANAN" sortKey="isActive" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-center" />
              <th className="p-4 font-semibold text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {sortedData.length > 0 ? (
              sortedData.map((u: any, idx: number) => {
                const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date()
                const lockMinutesRemaining = isLocked ? Math.max(1, Math.ceil((new Date(u.lockedUntil).getTime() - Date.now()) / (1000 * 60))) : 0

                return (
                  <tr key={u.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4 text-center text-text-main font-medium">{idx + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border shadow-sm shrink-0 ${
                          u.role === "ADMIN" ? "bg-rose-50 text-rose-600 border-rose-200" :
                          u.role === "KEPALA_SEKOLAH" ? "bg-purple-50 text-purple-600 border-purple-200" :
                          u.role === "YAYASAN" ? "bg-emerald-50 text-[#065f32] border-emerald-200" :
                          "bg-blue-50 text-blue-600 border-blue-200"
                        }`}>
                          {u.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-text-main group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {u.name}
                            {u.mustChangePassword && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded" title="Wajib ganti password saat login">
                                <KeyRound size={10} /> Wajib Ganti Sandi
                              </span>
                            )}
                          </div>
                          <div className="text-text-muted text-xs font-mono mt-0.5">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 items-start">
                        {roleBadge(u.role)}
                        {u.unitSekolahId ? (
                          <span className="text-xs font-medium text-text-muted">
                            {u.unitSekolah?.name}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-600">
                            Global (Semua Unit)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-rose-300 animate-pulse">
                          <Lock size={12} className="text-rose-600" /> Terkunci ({lockMinutesRemaining}m)
                        </span>
                      ) : u.isActive ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[11px] font-medium border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full text-[11px] font-medium border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {isLocked && (
                          <button 
                            onClick={() => setUnlockUserId && setUnlockUserId(u.id)} 
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-300 hover:border-amber-600 transition-colors" 
                            title="Buka Kunci Akun Sekarang"
                          >
                            <Unlock size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => openEditUser(u)} 
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-600 transition-colors" 
                          title="Edit Pengguna"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setResetUserId(u.id)} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors" 
                          title="Reset Password"
                        >
                          <Key size={16} />
                        </button>
                        {u.isActive ? (
                          <button 
                            onClick={() => setDisableUserId(u.id)} 
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" 
                            title="Nonaktifkan Akun"
                          >
                            <XCircle size={16} />
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => setActivateUserId(u.id)} 
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 hover:border-emerald-600 transition-colors" 
                              title="Aktifkan Akun"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button 
                              onClick={() => setDeleteUserId && setDeleteUserId(u.id)} 
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" 
                              title="Hapus Permanen"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    {isInactiveTab ? (
                      <UserX size={48} className="text-gray-300 mb-4" />
                    ) : (
                      <Users size={48} className="text-gray-300 mb-4" />
                    )}
                    <h3 className="text-lg font-bold text-gray-900">
                      {isInactiveTab ? "Tidak ada pengguna nonaktif" : "Tidak ada pengguna aktif"}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {isInactiveTab 
                        ? "Semua akun pengguna saat ini berstatus aktif dalam sistem."
                        : "Coba ubah kriteria pencarian atau filter Anda."}
                    </p>
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

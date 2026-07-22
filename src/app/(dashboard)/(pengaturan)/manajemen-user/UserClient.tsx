"use client"

import { useState } from "react"
import { Users, Building, Plus, Edit2, Key, Shield, ShieldCheck, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { tambahPengguna, editPengguna, resetPasswordPengguna, tambahDivisi, editDivisi, hapusDivisi, nonaktifkanPengguna } from "@/actions/pengguna"

export default function UserClient({
  initialUsers, initialDivisi, units
}: {
  initialUsers: any[], initialDivisi: any[], units: any[]
}) {
  const [activeTab, setActiveTab] = useState<"users" | "divisi">("users")
  const [users, setUsers] = useState(initialUsers)
  const [divisis, setDivisis] = useState(initialDivisi)

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterUnit, setFilterUnit] = useState("")

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false)
  const [formUser, setFormUser] = useState({ id: "", name: "", email: "", role: "TATA_USAHA", unitSekolahId: "", divisiId: "", isActive: true, password: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [disableUserId, setDisableUserId] = useState<string | null>(null)
  
  const [showDivModal, setShowDivModal] = useState(false)
  const [formDiv, setFormDiv] = useState({ id: "", name: "", description: "" })

  const [deleteDivId, setDeleteDivId] = useState<string | null>(null)

  // Derived filtered users
  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchRole = filterRole ? u.role === filterRole : true
    const matchUnit = filterUnit ? (filterUnit === "GLOBAL" ? !u.unitSekolahId : u.unitSekolahId === filterUnit) : true
    return matchSearch && matchRole && matchUnit
  })

  // Handlers User
  const openAddUser = () => {
    setFormUser({ id: "", name: "", email: "", role: "TATA_USAHA", unitSekolahId: "", divisiId: "", isActive: true, password: "" })
    setShowUserModal(true)
  }
  const openEditUser = (u: any) => {
    setFormUser({ id: u.id, name: u.name, email: u.email, role: u.role, unitSekolahId: u.unitSekolahId || "", divisiId: u.divisiId || "", isActive: u.isActive, password: "" })
    setShowUserModal(true)
  }
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formUser.id) {
        await editPengguna(formUser.id, formUser)
        window.location.reload()
      } else {
        await tambahPengguna(formUser)
        window.location.reload()
      }
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }
  const handleResetPass = async () => {
    if (!resetUserId) return
    setIsSubmitting(true)
    try {
      await resetPasswordPengguna(resetUserId)
      alert("Password direset menjadi: albas123")
      setResetUserId(null)
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }

  const handleDisableUser = async () => {
    if (!disableUserId) return
    setIsSubmitting(true)
    try {
      await nonaktifkanPengguna(disableUserId)
      window.location.reload()
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }

  // Handlers Divisi
  const handleSubmitDivisi = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formDiv.id) await editDivisi(formDiv.id, formDiv)
      else await tambahDivisi(formDiv)
      window.location.reload()
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }
  const handleDeleteDivisi = async () => {
    if (!deleteDivId) return
    setIsSubmitting(true)
    try {
      await hapusDivisi(deleteDivId)
      window.location.reload()
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }

  const roleBadge = (role: string) => {
    switch(role) {
      case "ADMIN": return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 w-max"><ShieldCheck size={12} /> SUPER ADMIN</span>
      case "TATA_USAHA": return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-bold w-max">TATA USAHA</span>
      case "KEPALA_SEKOLAH": return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg text-xs font-bold w-max">KEPALA SEKOLAH</span>
      default: return <span>{role}</span>
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Manajemen User & Divisi</h1>
          <p className="text-text-muted">Kelola akses sistem, role, divisi, dan unit kerja untuk staf Anda.</p>
        </div>
      </div>

      <ConfirmModal isOpen={!!resetUserId} title="Reset Password" message="Yakin ingin mereset password pengguna ini menjadi 'albas123'?" onCancel={() => setResetUserId(null)} onConfirm={handleResetPass} isLoading={isSubmitting} />
      <ConfirmModal isOpen={!!disableUserId} title="Nonaktifkan Akun" message="Yakin ingin menonaktifkan pengguna ini? Mereka tidak akan bisa login lagi ke sistem." onCancel={() => setDisableUserId(null)} onConfirm={handleDisableUser} isLoading={isSubmitting} />
      <ConfirmModal isOpen={!!deleteDivId} title="Hapus Divisi" message="Yakin ingin menghapus divisi ini?" onCancel={() => setDeleteDivId(null)} onConfirm={handleDeleteDivisi} isLoading={isSubmitting} />

      {/* TABS */}
      <div className="flex gap-1 mb-6 bg-bg rounded-xl p-1.5 w-max">
        <button onClick={() => setActiveTab("users")} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "users" ? "bg-surface shadow-sm text-primary" : "text-text-muted hover:text-text-main"}`}>
          <Users size={16} /> Pengguna Sistem ({users.length})
        </button>
        <button onClick={() => setActiveTab("divisi")} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "divisi" ? "bg-surface shadow-sm text-primary" : "text-text-muted hover:text-text-main"}`}>
          <Building size={16} /> Master Divisi ({divisis.length})
        </button>
      </div>

      {activeTab === "users" && (
        <div className="bg-surface/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-gradient-to-r from-bg/50 to-transparent">
            <h2 className="font-bold text-text-main shrink-0 text-xl flex items-center gap-2">
              <Users className="text-primary" /> Pengguna Sistem
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <input type="text" placeholder="Cari nama/email..." className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-primary focus:ring-2 focus:ring-primary/20 w-64 shadow-sm transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm shadow-sm" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="">Semua Role</option>
                <option value="ADMIN">ADMIN</option>
                <option value="TATA_USAHA">TATA_USAHA</option>
                <option value="KEPALA_SEKOLAH">KEPALA_SEKOLAH</option>
              </select>
              <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm shadow-sm" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
                <option value="">Semua Unit</option>
                <option value="GLOBAL">Global (Semua)</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <Button onClick={openAddUser} className="rounded-xl shadow-md"><Plus size={18} className="mr-1.5" /> Tambah Pengguna</Button>
            </div>
          </div>
          
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-bg/30">
            {filteredUsers.length > 0 ? filteredUsers.map(u => (
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
      )}

      {activeTab === "divisi" && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden max-w-3xl">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="font-bold text-text-main">Daftar Divisi</h2>
            <Button onClick={() => { setFormDiv({id: "", name: "", description: ""}); setShowDivModal(true) }}>
              <Plus size={16} className="mr-1.5" /> Tambah Divisi
            </Button>
          </div>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-bg border-b border-border text-text-muted">
                <th className="p-4 font-semibold">Nama Divisi</th>
                <th className="p-4 font-semibold">Keterangan</th>
                <th className="p-4 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {divisis.map(d => (
                <tr key={d.id} className="border-b border-border">
                  <td className="p-4 font-bold text-text-main">{d.name}</td>
                  <td className="p-4 text-text-muted">{d.description || "-"}</td>
                  <td className="p-4 text-center flex gap-1 justify-center">
                    <button onClick={() => { setFormDiv({id: d.id, name: d.name, description: d.description || ""}); setShowDivModal(true) }} className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteDivId(d.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><XCircle size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
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
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <p className="text-xs text-text-muted">Pilih unit jika staf hanya boleh mengurus 1 sekolah.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-main">Divisi</label>
                <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formUser.divisiId} onChange={e => setFormUser({...formUser, divisiId: e.target.value})}>
                  <option value="">-- Tanpa Divisi --</option>
                  {divisis.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
      )}

      {/* Divisi Modal */}
      {showDivModal && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <form onSubmit={handleSubmitDivisi} className="w-full max-w-sm bg-surface rounded-2xl shadow-xl border border-border flex flex-col">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-lg">{formDiv.id ? "Edit" : "Tambah"} Divisi</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-main">Nama Divisi <span className="text-red-500">*</span></label>
                <Input value={formDiv.name} onChange={e => setFormDiv({...formDiv, name: e.target.value})} required autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-main">Keterangan</label>
                <Input value={formDiv.description} onChange={e => setFormDiv({...formDiv, description: e.target.value})} />
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDivModal(false)}>Batal</Button>
              <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

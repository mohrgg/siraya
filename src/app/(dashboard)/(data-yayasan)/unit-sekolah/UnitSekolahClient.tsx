"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { 
  Building2, Plus, Edit2, Trash2, Search, Users, 
  Layers, GraduationCap, BookOpen, MapPin, Phone, 
  Eye, LayoutGrid, Table as TableIcon,
  CheckCircle2, XCircle, UserCheck
} from "lucide-react"
import { tambahUnitSekolah, editUnitSekolah, hapusUnitSekolah } from "@/actions/unit-sekolah"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { useSortableData } from "@/hooks/useSortableData"
import { SortableHeader } from "@/components/ui/SortableHeader"
import UnitAuditSideDrawer, { UnitAuditData } from "@/components/dashboard/UnitAuditSideDrawer"
import toast from "react-hot-toast"

export type UnitSekolah = { 
  id: string
  name: string
  level: string
  address: string | null
  phone: string | null
  email?: string | null
  website?: string | null
  namaKepalaSekolah?: string | null
  nipKepalaSekolah?: string | null
  namaKepalaTU?: string | null
  nipKepalaTU?: string | null
  namaBendaharaUnit?: string | null
  kotaPenandatangan?: string | null
  logo?: string | null
  isActive: boolean
  _count?: {
    murid: number
    subKelas: number
    guru: number
    jurusan: number
  }
  createdAt?: Date
  updatedAt?: Date
}

export default function UnitSekolahClient({ 
  initialData, 
  userRole 
}: { 
  initialData: UnitSekolah[]
  userRole?: string 
}) {
  const router = useRouter()
  const isReadOnly = userRole !== "ADMIN"
  const [data, setData] = useState<UnitSekolah[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ 
    id: "", 
    name: "", 
    level: "SD", 
    address: "", 
    phone: "", 
    email: "", 
    website: "", 
    namaKepalaSekolah: "", 
    nipKepalaSekolah: "", 
    isActive: true 
  })

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Drawer Audit State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedDrawerIndex, setSelectedDrawerIndex] = useState(0)

  // Filtered & Sorted Data
  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.namaKepalaSekolah && item.namaKepalaSekolah.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData)

  // Executive KPI summary calculations
  const totalUnits = data.length
  const totalActiveUnits = data.filter(u => u.isActive).length
  const totalSiswa = data.reduce((acc, u) => acc + (u._count?.murid || 0), 0)
  const totalRombel = data.reduce((acc, u) => acc + (u._count?.subKelas || 0), 0)
  const totalGuru = data.reduce((acc, u) => acc + (u._count?.guru || 0), 0)

  // Prepare drawer data list
  const drawerUnitDataList: UnitAuditData[] = data.map(u => ({
    id: u.id,
    name: u.name,
    total: u._count?.murid || 0,
    rombel: u._count?.subKelas || 0,
    guru: u._count?.guru || 0,
    kolektibilitas: 100
  }))

  const handleOpenDrawerForUnit = (unitId: string) => {
    const idx = data.findIndex(u => u.id === unitId)
    if (idx !== -1) {
      setSelectedDrawerIndex(idx)
      setIsDrawerOpen(true)
    }
  }

  const handleOpenCreateModal = () => {
    setFormData({ 
      id: "", 
      name: "", 
      level: "SD", 
      address: "", 
      phone: "", 
      email: "", 
      website: "", 
      namaKepalaSekolah: "", 
      nipKepalaSekolah: "", 
      isActive: true 
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: UnitSekolah) => {
    setFormData({ 
      id: item.id, 
      name: item.name, 
      level: item.level || "SD", 
      address: item.address || "", 
      phone: item.phone || "", 
      email: item.email || "", 
      website: item.website || "", 
      namaKepalaSekolah: item.namaKepalaSekolah || "", 
      nipKepalaSekolah: item.nipKepalaSekolah || "", 
      isActive: item.isActive 
    })
    setIsModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusUnitSekolah(deleteId)
      setData(prev => prev.filter(d => d.id !== deleteId))
      setDeleteId(null)
      toast.success("Unit sekolah berhasil dihapus.")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus unit sekolah.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formData.id) {
        const res = await editUnitSekolah(formData.id, { 
          name: formData.name, 
          level: formData.level,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          namaKepalaSekolah: formData.namaKepalaSekolah,
          nipKepalaSekolah: formData.nipKepalaSekolah,
          isActive: formData.isActive
        })
        setData(prev => prev.map(d => d.id === formData.id ? { ...d, ...res } : d))
        toast.success("Unit sekolah berhasil diperbarui.")
      } else {
        const res = await tambahUnitSekolah({ 
          name: formData.name, 
          level: formData.level,
          address: formData.address,
          phone: formData.phone
        })
        setData(prev => [...prev, res as any])
        toast.success("Unit sekolah baru berhasil ditambahkan.")
      }
      setIsModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data unit sekolah.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Level Badge Helper
  const getLevelBadge = (level: string) => {
    const l = level.toUpperCase()
    if (l === "SD" || l === "MI") {
      return { bg: "bg-blue-50 text-blue-700 border-blue-200", iconBg: "bg-blue-600 text-white" }
    } else if (l === "SMP" || l === "MTS") {
      return { bg: "bg-violet-50 text-violet-700 border-violet-200", iconBg: "bg-violet-600 text-white" }
    } else if (l === "SMK") {
      return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", iconBg: "bg-emerald-600 text-white" }
    } else if (l === "SMA" || l === "MA") {
      return { bg: "bg-amber-50 text-amber-700 border-amber-200", iconBg: "bg-amber-600 text-white" }
    }
    return { bg: "bg-slate-50 text-slate-700 border-slate-200", iconBg: "bg-slate-600 text-white" }
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Unit Sekolah"
        message="Apakah Anda yakin ingin menghapus unit sekolah ini? Pastikan tidak ada data ketergantungan seperti kelas, tagihan, atau siswa aktif."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* Add / Edit Unit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? "Edit Unit Sekolah" : "Tambah Unit Sekolah Baru"}
        subtitle="Kelola konfigurasi institusi dan data operasional unit pendidikan"
        icon={Building2}
        widthClassName="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Nama Unit Sekolah <span className="text-rose-500">*</span></label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                required 
                placeholder="ex: SMK Al Basyariah" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Jenjang / Level <span className="text-rose-500">*</span></label>
              <select 
                className="w-full px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium text-sm" 
                value={formData.level} 
                onChange={e => setFormData({ ...formData, level: e.target.value })} 
                required
              >
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="SMK">SMK</option>
                <option value="MI">MI</option>
                <option value="MTs">MTs</option>
                <option value="MA">MA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Nama Kepala Sekolah</label>
              <Input 
                value={formData.namaKepalaSekolah} 
                onChange={e => setFormData({ ...formData, namaKepalaSekolah: e.target.value })} 
                placeholder="Nama & Gelar" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">NIP / NUPTK Kepala Sekolah</label>
              <Input 
                value={formData.nipKepalaSekolah} 
                onChange={e => setFormData({ ...formData, nipKepalaSekolah: e.target.value })} 
                placeholder="Nomor Induk Pegawai" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">No. Telepon Kantor</label>
              <Input 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                placeholder="Contoh: 021-8790123" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Email Resmi Unit</label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                placeholder="admin@albasyariah.sch.id" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Alamat Lengkap</label>
            <textarea 
              rows={2}
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })} 
              className="w-full px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main text-sm resize-none placeholder-text-muted/50"
              placeholder="Jl. Raya Pabuaran No. 1..." 
            />
          </div>

          {formData.id && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input 
                type="checkbox" 
                id="isActive" 
                checked={formData.isActive} 
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })} 
                className="w-4 h-4 accent-primary rounded cursor-pointer" 
              />
              <label htmlFor="isActive" className="font-semibold cursor-pointer text-text-main text-sm">
                Status Unit Aktif (Tampilkan dalam pilihan sistem)
              </label>
            </div>
          )}
          
          <div className="flex gap-3 mt-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {formData.id ? "Simpan Perubahan" : "Simpan / Buat Unit Sekolah"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* KPI Summary Yayasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">Total Unit</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main">{totalUnits}</span>
              <span className="text-[11px] font-medium text-emerald-600">({totalActiveUnits} Aktif)</span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">Murid Konsolidasi</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main">{new Intl.NumberFormat('id-ID').format(totalSiswa)}</span>
              <span className="text-[11px] font-medium text-text-muted">Siswa</span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">Rombel / Kelas</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main">{new Intl.NumberFormat('id-ID').format(totalRombel)}</span>
              <span className="text-[11px] font-medium text-text-muted">Kelas</span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">Pendidik & Tendik</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-text-main">{new Intl.NumberFormat('id-ID').format(totalGuru)}</span>
              <span className="text-[11px] font-medium text-text-muted">Guru</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Unified Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        {/* Tab Header Wajib Siraya */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary">
            Daftar Unit Sekolah
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center flex-1 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cari unit atau kepsek..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-bg p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${viewMode === "grid" ? "bg-surface shadow-xs text-primary font-bold" : "text-text-muted hover:text-text-main"}`}
                title="Tampilan Grid Card"
              >
                <LayoutGrid size={15} />
                <span className="hidden md:inline">Grid Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${viewMode === "table" ? "bg-surface shadow-xs text-primary font-bold" : "text-text-muted hover:text-text-main"}`}
                title="Tampilan Tabel"
              >
                <TableIcon size={15} />
                <span className="hidden md:inline">Tabel</span>
              </button>
            </div>
          </div>

          {!isReadOnly && (
            <div className="shrink-0 w-full sm:w-auto">
              <Button onClick={handleOpenCreateModal} className="w-full sm:w-auto flex items-center justify-center bg-primary text-white hover:bg-primary/90 shadow-sm">
                <Plus size={16} className="mr-1.5" />
                <span>Tambah Unit Sekolah</span>
              </Button>
            </div>
          )}
        </div>

        {/* VIEW 1: EXECUTIVE METRIC CARD GRID */}
        {viewMode === "grid" ? (
          <div>
            {sortedData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedData.map((unit) => {
                  const badgeStyle = getLevelBadge(unit.level)
                  return (
                    <div 
                      key={unit.id}
                      className="group bg-surface rounded-2xl border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Card Header & Title */}
                      <div className="p-5 border-b border-border/60">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-xs ${badgeStyle.iconBg}`}>
                              {unit.level.toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">
                                {unit.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${badgeStyle.bg}`}>
                                  Jenjang {unit.level}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md ${unit.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                  {unit.isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                                  {unit.isActive ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Edit/Delete on top-right */}
                          {!isReadOnly && (
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenEditModal(unit)}
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors"
                                title="Edit Identitas Unit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button 
                                onClick={() => setDeleteId(unit.id)}
                                className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                                title="Hapus Unit"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Kepsek & PIC Info */}
                        <div className="mt-4 pt-3 border-t border-dashed border-border/80 flex items-center justify-between text-xs text-text-muted">
                          <div className="flex items-center gap-1.5">
                            <UserCheck size={14} className="text-primary/70 shrink-0" />
                            <span>Kepsek: <strong className="font-semibold text-text-main">{unit.namaKepalaSekolah || "Belum diset"}</strong></span>
                          </div>
                          {unit.phone && (
                            <div className="flex items-center gap-1">
                              <Phone size={12} />
                              <span>{unit.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body: 4 Live Metric Indicators */}
                      <div className="p-5 bg-bg/30">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="p-2.5 bg-surface rounded-xl border border-border/80 shadow-2xs">
                            <Users size={16} className="mx-auto text-blue-600 mb-1" />
                            <p className="text-base font-extrabold text-text-main">{unit._count?.murid || 0}</p>
                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mt-0.5">Siswa</p>
                          </div>

                          <div className="p-2.5 bg-surface rounded-xl border border-border/80 shadow-2xs">
                            <Layers size={16} className="mx-auto text-violet-600 mb-1" />
                            <p className="text-base font-extrabold text-text-main">{unit._count?.subKelas || 0}</p>
                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mt-0.5">Rombel</p>
                          </div>

                          <div className="p-2.5 bg-surface rounded-xl border border-border/80 shadow-2xs">
                            <GraduationCap size={16} className="mx-auto text-amber-600 mb-1" />
                            <p className="text-base font-extrabold text-text-main">{unit._count?.guru || 0}</p>
                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mt-0.5">Guru</p>
                          </div>

                          <div className="p-2.5 bg-surface rounded-xl border border-border/80 shadow-2xs">
                            <BookOpen size={16} className="mx-auto text-emerald-600 mb-1" />
                            <p className="text-base font-extrabold text-text-main">{unit._count?.jurusan || 0}</p>
                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mt-0.5">Jurusan</p>
                          </div>
                        </div>

                        {unit.address && (
                          <div className="mt-3 flex items-start gap-1.5 text-xs text-text-muted line-clamp-1">
                            <MapPin size={13} className="shrink-0 text-text-muted mt-0.5" />
                            <span className="truncate">{unit.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Action Links */}
                      <div className="px-5 py-3.5 bg-surface border-t border-border flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawerForUnit(unit.id)}
                          className="text-xs font-bold text-primary hover:text-primary/80 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>Audit Metrik Rinci</span>
                        </button>

                        <span className="text-[11px] text-text-muted">
                          ID: <code className="font-mono text-[10px] text-text-muted">{unit.id.slice(0, 8)}...</code>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center text-text-muted">
                <Building2 size={40} className="text-gray-300 mb-3" />
                <p className="font-medium text-text-main mb-1">Belum ada data unit sekolah...</p>
                <p className="text-sm">Cobalah mencari dengan kata kunci lain atau tambahkan unit sekolah baru.</p>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: DETAIL TABLE */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold text-center w-12">NO</th>
                  <SortableHeader label="NAMA UNIT" sortKey="name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-left" />
                  <SortableHeader label="LEVEL" sortKey="level" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-left" />
                  <th className="p-4 font-semibold text-center">SISWA</th>
                  <th className="p-4 font-semibold text-center">ROMBEL</th>
                  <th className="p-4 font-semibold text-center">GURU</th>
                  <th className="p-4 font-semibold text-center">JURUSAN</th>
                  <SortableHeader label="STATUS" sortKey="isActive" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-left" />
                  <th className="p-4 font-semibold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {sortedData.map((item, idx) => {
                  const badgeStyle = getLevelBadge(item.level)
                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 text-center font-medium text-text-muted">{idx + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${badgeStyle.iconBg}`}>
                            {item.level}
                          </div>
                          <div>
                            <span className="font-bold text-text-main block">{item.name}</span>
                            <span className="text-xs text-text-muted font-normal">Kepsek: {item.namaKepalaSekolah || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${badgeStyle.bg}`}>
                          {item.level}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-text-main">{item._count?.murid || 0}</td>
                      <td className="p-4 text-center font-bold text-text-main">{item._count?.subKelas || 0}</td>
                      <td className="p-4 text-center font-bold text-text-main">{item._count?.guru || 0}</td>
                      <td className="p-4 text-center font-bold text-text-main">{item._count?.jurusan || 0}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1 ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {item.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleOpenDrawerForUnit(item.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors"
                            title="Audit Metrik Rinci"
                          >
                            <Eye size={15} />
                          </button>
                          {!isReadOnly && (
                            <>
                              <button 
                                onClick={() => handleOpenEditModal(item)} 
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 hover:border-emerald-600 transition-colors" 
                                title="Edit Unit Sekolah"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button 
                                onClick={() => setDeleteId(item.id)} 
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" 
                                title="Hapus Unit Sekolah"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {sortedData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8">
                      <div className="flex flex-col items-center justify-center text-text-muted">
                        <Building2 size={40} className="text-gray-300 mb-3" />
                        <p className="font-medium text-text-main mb-1">Belum ada data...</p>
                        <p className="text-xs">Cobalah mencari dengan kata kunci lain.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side Drawer: Unit Audit */}
      <UnitAuditSideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        unitDataList={drawerUnitDataList}
        currentUnitIndex={selectedDrawerIndex}
        onSelectUnitIndex={setSelectedDrawerIndex}
      />
    </div>
  )
}

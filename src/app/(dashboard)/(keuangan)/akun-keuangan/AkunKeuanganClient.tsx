"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Plus, Edit2, Trash2, Layers, Book, Search, X } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { SideDrawer } from "@/components/ui/SideDrawer"
import { tambahSubKlasifikasi, editSubKlasifikasi, hapusSubKlasifikasi, tambahAkunDetail, editAkunDetail, hapusAkunDetail } from "@/actions/akun-keuangan"
import toast from "react-hot-toast"

type Klasifikasi = { id: string, kode: string, nama: string }
type SubKlasifikasi = { id: string, kode: string, nama: string, klasifikasiAkunId: string, klasifikasi?: Klasifikasi, _count?: { akunDetail: number } }
type AkunDetail = { id: string, kode: string, nama: string, subKlasifikasiAkunId: string, unitSekolahId: string | null, isKasBank: boolean, isActive: boolean, subKlasifikasi?: SubKlasifikasi, unitSekolah?: { id: string, name: string } | null }

export default function AkunKeuanganClient({ 
  initialKlasifikasi, 
  initialSubKlasifikasi, 
  initialAkunDetail, 
  unitSekolahList,
  userRole,
  userUnitId
}: { 
  initialKlasifikasi: Klasifikasi[], 
  initialSubKlasifikasi: SubKlasifikasi[], 
  initialAkunDetail: AkunDetail[],
  unitSekolahList: any[],
  userRole?: string,
  userUnitId?: string | null
}) {
  const isReadOnly = userRole === "KEPALA_SEKOLAH"

  const [activeTab, setActiveTab] = useState<"AKUN" | "SUBKLASIFIKASI">("AKUN")
  const [searchTerm, setSearchTerm] = useState("")

  // Data States
  const [klasifikasi] = useState<Klasifikasi[]>(initialKlasifikasi)
  const [subKlasifikasi, setSubKlasifikasi] = useState<SubKlasifikasi[]>(initialSubKlasifikasi)
  const [akunDetail, setAkunDetail] = useState<AkunDetail[]>(initialAkunDetail)

  // Drawer States
  const [isSubKlasDrawerOpen, setIsSubKlasDrawerOpen] = useState(false)
  const [isAkunDrawerOpen, setIsAkunDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form States
  const [subKlasForm, setSubKlasForm] = useState({ id: "", kode: "", nama: "", klasifikasiAkunId: klasifikasi[0]?.id || "" })
  const [akunForm, setAkunForm] = useState({ id: "", kode: "", nama: "", subKlasifikasiAkunId: subKlasifikasi[0]?.id || "", unitSekolahId: "", isKasBank: false, isActive: true })

  // Delete States
  const [deleteSubKlasId, setDeleteSubKlasId] = useState<string | null>(null)
  const [deleteAkunId, setDeleteAkunId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtering Logic
  const filteredSubKlas = subKlasifikasi.filter(s => 
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.kode.includes(searchTerm)
  )

  const filteredAkun = akunDetail.filter(a => {
    const matchesSearch = a.nama.toLowerCase().includes(searchTerm.toLowerCase()) || a.kode.includes(searchTerm)
    
    // Role-based visibility
    if (userRole === "TATA_USAHA" && userUnitId) {
      // TU can only see Global accounts (unitSekolahId = null) or Accounts specific to their unit
      const matchesUnit = a.unitSekolahId === null || a.unitSekolahId === userUnitId
      return matchesSearch && matchesUnit
    }
    return matchesSearch
  })

  // ===================== HANDLERS UNTUK SUBKLASIFIKASI =====================
  const handleEditSubKlas = (item: SubKlasifikasi) => {
    setSubKlasForm({ id: item.id, kode: item.kode, nama: item.nama, klasifikasiAkunId: item.klasifikasiAkunId })
    setIsSubKlasDrawerOpen(true)
  }

  const handleSaveSubKlas = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (subKlasForm.id) {
        const res = await editSubKlasifikasi(subKlasForm.id, subKlasForm)
        const updatedKlasifikasi = klasifikasi.find(k => k.id === res.klasifikasiAkunId)
        setSubKlasifikasi(prev => prev.map(s => s.id === subKlasForm.id ? { ...s, ...res, klasifikasi: updatedKlasifikasi } : s))
        toast.success("Subklasifikasi berhasil diperbarui")
      } else {
        const res = await tambahSubKlasifikasi(subKlasForm)
        const newKlasifikasi = klasifikasi.find(k => k.id === res.klasifikasiAkunId)
        setSubKlasifikasi(prev => [...prev, { ...res, klasifikasi: newKlasifikasi, _count: { akunDetail: 0 } }])
        toast.success("Subklasifikasi berhasil ditambahkan")
      }
      setIsSubKlasDrawerOpen(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubKlas = async () => {
    if (!deleteSubKlasId) return
    setIsDeleting(true)
    try {
      await hapusSubKlasifikasi(deleteSubKlasId)
      setSubKlasifikasi(prev => prev.filter(s => s.id !== deleteSubKlasId))
      toast.success("Subklasifikasi berhasil dihapus")
      setDeleteSubKlasId(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // ===================== HANDLERS UNTUK AKUN DETAIL =====================
  const handleEditAkun = (item: AkunDetail) => {
    setAkunForm({ 
      id: item.id, 
      kode: item.kode, 
      nama: item.nama, 
      subKlasifikasiAkunId: item.subKlasifikasiAkunId,
      unitSekolahId: item.unitSekolahId || "",
      isKasBank: item.isKasBank,
      isActive: item.isActive
    })
    setIsAkunDrawerOpen(true)
  }

  const handleSaveAkun = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        ...akunForm,
        unitSekolahId: akunForm.unitSekolahId === "" ? null : akunForm.unitSekolahId
      }

      if (akunForm.id) {
        const res = await editAkunDetail(akunForm.id, payload)
        const subK = subKlasifikasi.find(s => s.id === res.subKlasifikasiAkunId)
        const unit = unitSekolahList.find(u => u.id === res.unitSekolahId)
        setAkunDetail(prev => prev.map(a => a.id === akunForm.id ? { ...a, ...res, subKlasifikasi: subK, unitSekolah: unit } : a))
        toast.success("Akun berhasil diperbarui")
      } else {
        const res = await tambahAkunDetail(payload)
        const subK = subKlasifikasi.find(s => s.id === res.subKlasifikasiAkunId)
        const unit = unitSekolahList.find(u => u.id === res.unitSekolahId)
        setAkunDetail(prev => [...prev, { ...res, subKlasifikasi: subK, unitSekolah: unit }])
        toast.success("Akun berhasil ditambahkan")
      }
      setIsAkunDrawerOpen(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAkun = async () => {
    if (!deleteAkunId) return
    setIsDeleting(true)
    try {
      await hapusAkunDetail(deleteAkunId)
      setAkunDetail(prev => prev.filter(a => a.id !== deleteAkunId))
      toast.success("Akun berhasil dihapus")
      setDeleteAkunId(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Helpers
  const getKlasifikasiColor = (kode: string) => {
    switch(kode) {
      case '1': return 'bg-blue-100 text-blue-700'
      case '2': return 'bg-orange-100 text-orange-700'
      case '3': return 'bg-purple-100 text-purple-700'
      case '4': return 'bg-emerald-100 text-emerald-700'
      case '5': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      {/* Delete Modals */}
      <ConfirmModal isOpen={!!deleteSubKlasId} title="Hapus Subklasifikasi" message="Yakin ingin menghapus subklasifikasi ini? Tindakan ini tidak dapat dibatalkan." onCancel={() => setDeleteSubKlasId(null)} onConfirm={handleDeleteSubKlas} isLoading={isDeleting} />
      <ConfirmModal isOpen={!!deleteAkunId} title="Hapus Akun" message="Yakin ingin menghapus akun keuangan ini?" onCancel={() => setDeleteAkunId(null)} onConfirm={handleDeleteAkun} isLoading={isDeleting} />

      {/* Drawer SubKlasifikasi */}
      <SideDrawer
        isOpen={isSubKlasDrawerOpen}
        onClose={() => setIsSubKlasDrawerOpen(false)}
        title={subKlasForm.id ? "Edit Subklasifikasi" : "Tambah Subklasifikasi"}
        subtitle="Pengelompokan Akun Transaksi"
        icon={<Layers size={24} />}
        widthClassName="max-w-md"
      >
        <form id="form-subklas" onSubmit={handleSaveSubKlas} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Kepala Akun (Klasifikasi Utama)</label>
            <select className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text-main" value={subKlasForm.klasifikasiAkunId} onChange={e => setSubKlasForm({ ...subKlasForm, klasifikasiAkunId: e.target.value })} required>
              {klasifikasi.map(k => <option key={k.id} value={k.id}>{k.kode} - {k.nama}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Kode Subklasifikasi</label>
            <Input placeholder="Contoh: 11" value={subKlasForm.kode} onChange={e => setSubKlasForm({ ...subKlasForm, kode: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Nama Subklasifikasi</label>
            <Input placeholder="Contoh: Kas & Bank" value={subKlasForm.nama} onChange={e => setSubKlasForm({ ...subKlasForm, nama: e.target.value })} required />
          </div>
          <div className="pt-4 border-t border-border flex justify-end gap-3 mt-auto">
            <Button type="button" variant="outline" onClick={() => setIsSubKlasDrawerOpen(false)}>Batal</Button>
            <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
          </div>
        </form>
      </SideDrawer>

      {/* Drawer Akun Detail */}
      <SideDrawer
        isOpen={isAkunDrawerOpen}
        onClose={() => setIsAkunDrawerOpen(false)}
        title={akunForm.id ? "Edit Akun Transaksi" : "Tambah Akun Transaksi"}
        subtitle="Daftar Akun Transaksional"
        icon={<Book size={24} />}
        widthClassName="max-w-lg"
      >
        <form id="form-akun" onSubmit={handleSaveAkun} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Induk (Subklasifikasi)</label>
            <select className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text-main" value={akunForm.subKlasifikasiAkunId} onChange={e => setAkunForm({ ...akunForm, subKlasifikasiAkunId: e.target.value })} required>
              {subKlasifikasi.map(s => <option key={s.id} value={s.id}>{s.kode} - {s.nama}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Kode Akun</label>
            <Input placeholder="Contoh: 1101" value={akunForm.kode} onChange={e => setAkunForm({ ...akunForm, kode: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Nama Akun</label>
            <Input placeholder="Contoh: Kas Tunai Yayasan" value={akunForm.nama} onChange={e => setAkunForm({ ...akunForm, nama: e.target.value })} required />
          </div>
          
          <div className="flex flex-col gap-1.5 p-4 bg-primary/5 border border-primary/10 rounded-xl mt-2">
            <label className="text-sm font-semibold text-primary">Tingkat Kepemilikan (Eksklusivitas)</label>
            <p className="text-xs text-text-muted mb-2">Kosongkan jika akun ini berlaku Global/Yayasan (semua unit bisa memakai).</p>
            <select className="w-full px-3 py-2 bg-white border border-border rounded-lg text-text-main" value={akunForm.unitSekolahId} onChange={e => setAkunForm({ ...akunForm, unitSekolahId: e.target.value })}>
              <option value="">-- Akun Global (Semua Unit) --</option>
              {unitSekolahList.map(u => <option key={u.id} value={u.id}>Eksklusif: {u.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-xl hover:bg-bg transition-colors">
              <input type="checkbox" checked={akunForm.isKasBank} onChange={e => setAkunForm({ ...akunForm, isKasBank: e.target.checked })} className="w-4 h-4 accent-primary" />
              <div>
                <span className="text-sm font-semibold text-text-main block">Akun Kas / Bank (Liquid)</span>
                <span className="text-xs text-text-muted">Centang jika akun ini bisa menerima atau mengeluarkan uang secara langsung.</span>
              </div>
            </label>
            
            {akunForm.id && (
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-xl hover:bg-bg transition-colors">
                <input type="checkbox" checked={akunForm.isActive} onChange={e => setAkunForm({ ...akunForm, isActive: e.target.checked })} className="w-4 h-4 accent-albas-green" />
                <span className="text-sm font-semibold text-text-main">Akun Aktif</span>
              </label>
            )}
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3 mt-auto">
            <Button type="button" variant="outline" onClick={() => setIsAkunDrawerOpen(false)}>Batal</Button>
            <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
          </div>
        </form>
      </SideDrawer>

      {/* Main Container */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        {/* Tabs & Controls */}
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2 p-1 bg-bg rounded-xl">
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'AKUN' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-main'}`}
              onClick={() => setActiveTab('AKUN')}
            >
              Daftar Akun
            </button>
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'SUBKLASIFIKASI' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-main'}`}
              onClick={() => setActiveTab('SUBKLASIFIKASI')}
            >
              Subklasifikasi
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Cari kode atau nama..." 
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {!isReadOnly && activeTab === 'AKUN' && (
              <Button onClick={() => {
                setAkunForm({ id: "", kode: "", nama: "", subKlasifikasiAkunId: subKlasifikasi[0]?.id || "", unitSekolahId: "", isKasBank: false, isActive: true })
                setIsAkunDrawerOpen(true)
              }} className="shrink-0">
                <Plus size={16} className="mr-2"/> Tambah Akun
              </Button>
            )}
            {!isReadOnly && activeTab === 'SUBKLASIFIKASI' && (
              <Button onClick={() => {
                setSubKlasForm({ id: "", kode: "", nama: "", klasifikasiAkunId: klasifikasi[0]?.id || "" })
                setIsSubKlasDrawerOpen(true)
              }} className="shrink-0">
                <Plus size={16} className="mr-2"/> Tambah Subklas
              </Button>
            )}
          </div>
        </div>

        {/* Tab Content: AKUN */}
        {activeTab === 'AKUN' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">KODE</th>
                  <th className="p-4 font-semibold">NAMA AKUN</th>
                  <th className="p-4 font-semibold">KLASIFIKASI</th>
                  <th className="p-4 font-semibold">KEPEMILIKAN (UNIT)</th>
                  <th className="p-4 font-semibold text-center">KAS/BANK</th>
                  <th className="p-4 font-semibold text-center">STATUS</th>
                  {!isReadOnly && <th className="p-4 font-semibold text-right">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAkun.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-mono font-semibold text-primary">{item.kode}</td>
                    <td className="p-4 text-text-main font-semibold">{item.nama}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${getKlasifikasiColor(item.subKlasifikasi?.klasifikasi?.kode || '')}`}>
                          {item.subKlasifikasi?.klasifikasi?.nama}
                        </span>
                        <span className="text-xs text-text-muted">{item.subKlasifikasi?.kode} - {item.subKlasifikasi?.nama}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {item.unitSekolahId ? (
                        <span className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md border border-amber-200">
                          {item.unitSekolah?.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                          Global
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {item.isKasBank && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">LIQUID</span>}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${item.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </td>
                    {!isReadOnly && (
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditAkun(item)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setDeleteAkunId(item.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredAkun.length === 0 && (
                  <tr>
                    <td colSpan={isReadOnly ? 6 : 7} className="p-8 text-center text-text-muted flex flex-col items-center">
                      <Book size={40} className="text-gray-300 mb-3" />
                      <p>Belum ada data Akun Transaksi.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: SUBKLASIFIKASI */}
        {activeTab === 'SUBKLASIFIKASI' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">KODE</th>
                  <th className="p-4 font-semibold">NAMA SUBKLASIFIKASI</th>
                  <th className="p-4 font-semibold">INDUK (KLASIFIKASI)</th>
                  <th className="p-4 font-semibold text-center">JML AKUN</th>
                  {!isReadOnly && <th className="p-4 font-semibold text-right">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {filteredSubKlas.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-mono font-semibold text-primary">{item.kode}</td>
                    <td className="p-4 text-text-main font-semibold">{item.nama}</td>
                    <td className="p-4">
                       <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getKlasifikasiColor(item.klasifikasi?.kode || '')}`}>
                          {item.klasifikasi?.kode} - {item.klasifikasi?.nama}
                        </span>
                    </td>
                    <td className="p-4 text-center font-medium text-text-muted">
                      {item._count?.akunDetail || 0}
                    </td>
                    {!isReadOnly && (
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditSubKlas(item)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setDeleteSubKlasId(item.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredSubKlas.length === 0 && (
                  <tr>
                    <td colSpan={isReadOnly ? 4 : 5} className="p-8 text-center text-text-muted flex flex-col items-center">
                      <Layers size={40} className="text-gray-300 mb-3" />
                      <p>Belum ada data Subklasifikasi.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

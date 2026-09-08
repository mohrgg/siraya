"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Plus, Edit2, Trash2, Layers, Book, Search, X } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { SideDrawer } from "@/components/ui/SideDrawer"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { tambahSubKlasifikasi, editSubKlasifikasi, hapusSubKlasifikasi, tambahAkunDetail, editAkunDetail, hapusAkunDetail } from "@/actions/akun-keuangan"
import toast from "react-hot-toast"

type Klasifikasi = { id: string, kode: string, nama: string }
type SubKlasifikasi = { id: string, kode: string, nama: string, klasifikasiAkunId: string, klasifikasi?: Klasifikasi, _count?: { akunDetail: number } }
type AkunDetail = { id: string, kode: string, nama: string, subKlasifikasiAkunId: string, unitSekolahId: string | null, isKasBank: boolean, isSPP: boolean, isActive: boolean, subKlasifikasi?: SubKlasifikasi, unitSekolah?: { id: string, name: string } | null }

export default function AkunKeuanganClient({ 
  initialKlasifikasi, 
  initialSubKlasifikasi, 
  initialAkunDetail, 
  unitSekolahList = [],
  userRole = "TATA_USAHA",
  userUnitId = "",
  isGlobal = false,
  activeUnitId = ""
}: { 
  initialKlasifikasi: Klasifikasi[], 
  initialSubKlasifikasi: SubKlasifikasi[], 
  initialAkunDetail: AkunDetail[],
  unitSekolahList?: { id: string, name: string }[],
  userRole?: string,
  userUnitId?: string | null,
  isGlobal?: boolean,
  activeUnitId?: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isReadOnly = userRole === "KEPALA_SEKOLAH" || userRole === "YAYASAN"
  const canEditKategori = !isReadOnly // TU and Admin can edit Kategori

  const [activeTab, setActiveTab] = useState<"AKUN" | "SUBKLASIFIKASI">("SUBKLASIFIKASI")
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
  const [akunForm, setAkunForm] = useState({ id: "", kode: "", nama: "", subKlasifikasiAkunId: subKlasifikasi[0]?.id || "", unitSekolahId: activeUnitId || "", isKasBank: false, isSPP: false, isActive: true })

  // Delete States
  const [deleteSubKlasId, setDeleteSubKlasId] = useState<string | null>(null)
  const [deleteAkunId, setDeleteAkunId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtering Logic
  const filteredSubKlasBase = subKlasifikasi.filter(s => 
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.kode.includes(searchTerm)
  )

  const { items: filteredSubKlas, sortConfig: subKlasSort, requestSort: handleSubKlasSort } = useSortableData(
    filteredSubKlasBase,
    { key: "kode", direction: "asc" }
  )

  const filteredAkunBase = akunDetail.filter(a => 
    a.nama.toLowerCase().includes(searchTerm.toLowerCase()) || a.kode.includes(searchTerm)
  )

  const { items: filteredAkun, sortConfig: akunSort, requestSort: handleAkunSort } = useSortableData(
    filteredAkunBase,
    { key: "kode", direction: "asc" }
  )

  // ===================== GENERATOR KODE OTOMATIS =====================
  const generateSubKlasKode = (klasId: string, currentSubKlasList: SubKlasifikasi[]) => {
    const klas = klasifikasi.find(k => k.id === klasId)
    if (!klas) return ""
    const prefix = klas.kode
    const existing = currentSubKlasList.filter(s => s.klasifikasiAkunId === klasId && s.kode.startsWith(prefix))
    if (existing.length === 0) return prefix + "1"
    const nums = existing.map(s => parseInt(s.kode)).filter(n => !isNaN(n))
    if (nums.length === 0) return prefix + "1"
    return (Math.max(...nums) + 1).toString()
  }

  const generateAkunKode = (subKlasId: string, currentAkunList: AkunDetail[]) => {
    const sub = subKlasifikasi.find(s => s.id === subKlasId)
    if (!sub) return ""
    const prefix = sub.kode
    const existing = currentAkunList.filter(a => a.subKlasifikasiAkunId === subKlasId && a.kode.startsWith(prefix))
    if (existing.length === 0) return prefix + "01"
    const nums = existing.map(a => parseInt(a.kode)).filter(n => !isNaN(n))
    if (nums.length === 0) return prefix + "01"
    return (Math.max(...nums) + 1).toString()
  }

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
        const payload = {
          kode: subKlasForm.kode,
          nama: subKlasForm.nama,
          klasifikasiAkunId: subKlasForm.klasifikasiAkunId
        }
        const res = await tambahSubKlasifikasi(payload)
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
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
      setDeleteSubKlasId(null)
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
      isSPP: item.isSPP ?? false,
      isActive: item.isActive
    })
    setIsAkunDrawerOpen(true)
  }

  const handleSaveAkun = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { id, ...restForm } = akunForm
      const payload = {
        ...restForm,
        unitSekolahId: restForm.unitSekolahId === "" ? undefined : restForm.unitSekolahId
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
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
      setDeleteAkunId(null)
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
            <select 
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text-main" 
              value={subKlasForm.klasifikasiAkunId} 
              onChange={e => {
                const newKlasId = e.target.value
                setSubKlasForm({ 
                  ...subKlasForm, 
                  klasifikasiAkunId: newKlasId, 
                  kode: subKlasForm.id ? subKlasForm.kode : generateSubKlasKode(newKlasId, subKlasifikasi) 
                })
              }} 
              required
            >
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
            <select 
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text-main" 
              value={akunForm.subKlasifikasiAkunId} 
              onChange={e => {
                const newSubId = e.target.value
                setAkunForm({ 
                  ...akunForm, 
                  subKlasifikasiAkunId: newSubId, 
                  kode: akunForm.id ? akunForm.kode : generateAkunKode(newSubId, akunDetail) 
                })
              }} 
              required
            >
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
            <label className="text-sm font-semibold text-primary">Kepemilikan Akun</label>
            <p className="text-sm text-text-main font-medium mt-1 p-2 bg-white border border-border rounded-lg">
              Terkunci untuk Unit: {unitSekolahList.find(u => u.id === (akunForm.unitSekolahId || activeUnitId))?.name || "Tidak diketahui"}
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-xl hover:bg-bg transition-colors">
              <input type="checkbox" checked={akunForm.isKasBank} onChange={e => setAkunForm({ ...akunForm, isKasBank: e.target.checked })} className="w-4 h-4 accent-primary" />
              <div>
                <span className="text-sm font-semibold text-text-main block">Akun Kas / Bank (Liquid)</span>
                <span className="text-xs text-text-muted">Centang jika akun ini bisa menerima atau mengeluarkan uang secara langsung.</span>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-xl hover:bg-bg transition-colors">
              <input type="checkbox" checked={akunForm.isSPP || false} onChange={e => setAkunForm({ ...akunForm, isSPP: e.target.checked })} className="w-4 h-4 accent-primary" />
              <div>
                <span className="text-sm font-semibold text-text-main block">Kategori Tagihan Bulanan (SPP)</span>
                <span className="text-xs text-text-muted">Centang jika tagihan akun ini rutin per bulan dan akan dikelompokkan secara matriks.</span>
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
      <div className="space-y-6">
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
          
          {/* Tabs Navigation */}
          <div className="flex gap-2 mb-6 border-b border-border">
            <button 
              className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'SUBKLASIFIKASI' ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text-main'}`}
              onClick={() => setActiveTab('SUBKLASIFIKASI')}
            >
              Kategori / Subklasifikasi
            </button>
            <button 
              className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'AKUN' ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text-main'}`}
              onClick={() => setActiveTab('AKUN')}
            >
              Daftar Akun Transaksi
            </button>
          </div>

          {/* Top Filter & Toolbar */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              <div className="relative w-full md:w-44 flex-shrink-0">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Cari kode atau nama..." 
                  className="w-full pl-10 pr-10 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              {isGlobal && (
                <div className="flex-shrink-0">
                  <select
                    className="px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={activeUnitId || ""}
                    onChange={(e) => {
                      const newUnit = e.target.value;
                      const url = new URL(window.location.href);
                      url.searchParams.set("unitId", newUnit);
                      router.push(pathname + "?" + url.searchParams.toString());
                    }}
                  >
                    {unitSekolahList.map((u) => (
                      <option key={u.id} value={u.id}>Unit: {u.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isReadOnly && activeTab === 'AKUN' && (
                <Button onClick={() => {
                  const defaultSubId = subKlasifikasi[0]?.id || ""
                  setAkunForm({ id: "", kode: generateAkunKode(defaultSubId, akunDetail), nama: "", subKlasifikasiAkunId: defaultSubId, unitSekolahId: activeUnitId || "", isKasBank: false, isSPP: false, isActive: true })
                  setIsAkunDrawerOpen(true)
                }} className="shrink-0">
                  <Plus size={16} className="mr-1.5"/> Tambah Akun
                </Button>
              )}
              {canEditKategori && activeTab === 'SUBKLASIFIKASI' && (
                <Button onClick={() => {
                  const defaultKlasId = klasifikasi[0]?.id || ""
                  setSubKlasForm({ id: "", kode: generateSubKlasKode(defaultKlasId, subKlasifikasi), nama: "", klasifikasiAkunId: defaultKlasId })
                  setIsSubKlasDrawerOpen(true)
                }} className="shrink-0">
                  <Plus size={16} className="mr-1.5"/> Tambah Subklasifikasi
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
                  <SortableHeader label="KODE" sortKey="kode" currentSortKey={akunSort?.key as string} currentDirection={akunSort?.direction} onSort={handleAkunSort} />
                  <SortableHeader label="NAMA AKUN" sortKey="nama" currentSortKey={akunSort?.key as string} currentDirection={akunSort?.direction} onSort={handleAkunSort} />
                  <SortableHeader label="KLASIFIKASI" sortKey="subKlasifikasi.klasifikasi.kode" currentSortKey={akunSort?.key as string} currentDirection={akunSort?.direction} onSort={handleAkunSort} />
                  <th className="p-4 font-semibold">KEPEMILIKAN (UNIT)</th>
                  <SortableHeader label="KAS/BANK" sortKey="isKasBank" currentSortKey={akunSort?.key as string} currentDirection={akunSort?.direction} onSort={handleAkunSort} className="text-center justify-center" />
                  <SortableHeader label="STATUS" sortKey="isActive" currentSortKey={akunSort?.key as string} currentDirection={akunSort?.direction} onSort={handleAkunSort} className="text-center justify-center" />
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
                          <button onClick={() => handleEditAkun(item)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-600 transition-colors" title="Edit Akun">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleteAkunId(item.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" title="Hapus Akun">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredAkun.length === 0 && (
                  <tr>
                    <td colSpan={isReadOnly ? 6 : 7} className="p-8">
                      <div className="flex flex-col items-center justify-center text-center text-text-muted">
                        <Book size={40} className="text-gray-300 mb-3" />
                        <p>Belum ada data Akun Transaksi.</p>
                      </div>
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
                  <SortableHeader label="KODE" sortKey="kode" currentSortKey={subKlasSort?.key as string} currentDirection={subKlasSort?.direction} onSort={handleSubKlasSort} />
                  <SortableHeader label="NAMA SUBKLASIFIKASI" sortKey="nama" currentSortKey={subKlasSort?.key as string} currentDirection={subKlasSort?.direction} onSort={handleSubKlasSort} />
                  <SortableHeader label="KEPALA AKUN (LEVEL 1)" sortKey="klasifikasi.kode" currentSortKey={subKlasSort?.key as string} currentDirection={subKlasSort?.direction} onSort={handleSubKlasSort} />
                  <SortableHeader label="JML AKUN DETAIL" sortKey="_count.akunDetail" currentSortKey={subKlasSort?.key as string} currentDirection={subKlasSort?.direction} onSort={handleSubKlasSort} className="text-center justify-center" />
                  {canEditKategori && <th className="p-4 font-semibold text-right">AKSI</th>}
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
                    {canEditKategori && (
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditSubKlas(item)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-600 transition-colors" title="Edit Subklasifikasi">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleteSubKlasId(item.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" title="Hapus Subklasifikasi">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredSubKlas.length === 0 && (
                  <tr>
                    <td colSpan={!canEditKategori ? 4 : 5} className="p-8">
                      <div className="flex flex-col items-center justify-center text-center text-text-muted">
                        <Layers size={40} className="text-gray-300 mb-3" />
                        <p>Belum ada data Subklasifikasi.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

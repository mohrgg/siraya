"use client"

import { useState } from "react"
import { Plus, FolderOpen, Folder, FileText, Edit2, Trash2, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, X, Search } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import {
  tambahKlasifikasiAkun, editKlasifikasiAkun, hapusKlasifikasiAkun,
  tambahSubKlasifikasiAkun, editSubKlasifikasiAkun, hapusSubKlasifikasiAkun,
  tambahAkunDetail, editAkunDetail, hapusAkunDetail, toggleAkunDetail,
  generateSubKlasifikasiCode, generateAkunDetailCode
} from "@/actions/akun-keuangan"

// Standar SIA - Chart of Accounts
const KLASIFIKASI_PRESETS = [
  { code: "1", name: "HARTA", desc: "Aset/Harta perusahaan" },
  { code: "2", name: "KEWAJIBAN", desc: "Utang/Liabilitas" },
  { code: "3", name: "MODAL", desc: "Ekuitas pemilik" },
  { code: "4", name: "PENDAPATAN", desc: "Penerimaan/Revenue" },
  { code: "5", name: "BIAYA BEBAN", desc: "Pengeluaran/Expense" },
]

type AkunDetailType = {
  id: string, code: string, name: string, isActive: boolean, bankAccountNumber?: string | null, subKlasifikasiAkunId: string
}
type SubKlasifikasiType = {
  id: string, code: string, name: string, klasifikasiAkunId: string, akunDetail: AkunDetailType[]
}
type KlasifikasiType = {
  id: string, code: string, name: string, subKlasifikasiAkun: SubKlasifikasiType[]
}

export default function AkunKeuanganClient({
  initialData, schoolUnits, initialUnitId
}: {
  initialData: KlasifikasiType[], schoolUnits: any[], initialUnitId: string
}) {
  const [data, setData] = useState<KlasifikasiType[]>(initialData)
  const [expandedCls, setExpandedCls] = useState<Set<string>>(new Set(initialData.map(d => d.id)))
  const [expandedSub, setExpandedSub] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")

  // Modal states
  const [modal, setModal] = useState<{
    type: "add-cls" | "edit-cls" | "add-sub" | "edit-sub" | "add-detail" | "edit-detail" | null,
    data?: any
  }>({ type: null })
  const [deleteModal, setDeleteModal] = useState<{ type: string, id: string, name: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form states
  const [formCls, setFormCls] = useState({ code: "", name: "" })
  const [formSub, setFormSub] = useState({ code: "", name: "", klasifikasiAkunId: "" })
  const [formDetail, setFormDetail] = useState({ code: "", name: "", subKlasifikasiAkunId: "", bankAccountNumber: "" })

  // Toggle expand
  const toggleCls = (id: string) => {
    const next = new Set(expandedCls)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedCls(next)
  }
  const toggleSub = (id: string) => {
    const next = new Set(expandedSub)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedSub(next)
  }

  // Count totals
  const totalSub = data.reduce((sum, cls) => sum + (cls.subKlasifikasiAkun?.length || 0), 0)
  const totalAkun = data.reduce((sum, cls) => sum + (cls.subKlasifikasiAkun?.reduce((s, sub) => s + (sub.akunDetail?.length || 0), 0) || 0), 0)
  const totalAktif = data.reduce((sum, cls) => sum + (cls.subKlasifikasiAkun?.reduce((s, sub) => s + (sub.akunDetail?.filter(a => a.isActive)?.length || 0), 0) || 0), 0)

  // Existing codes to filter presets
  const usedCodes = data.map(d => d.code)
  const availablePresets = KLASIFIKASI_PRESETS.filter(p => !usedCodes.includes(p.code))

  // === HANDLERS ===
  const openAddCls = () => {
    setFormCls({ code: availablePresets[0]?.code || "", name: availablePresets[0]?.name || "" })
    setModal({ type: "add-cls" })
  }
  const openEditCls = (cls: KlasifikasiType) => {
    setFormCls({ code: cls.code, name: cls.name })
    setModal({ type: "edit-cls", data: cls })
  }
  const openAddSub = async (klasifikasiAkunId?: string) => {
    const targetId = klasifikasiAkunId || ""
    let autoCode = ""
    if (targetId) {
      try { autoCode = await generateSubKlasifikasiCode(targetId) } catch { }
    }
    setFormSub({ code: autoCode, name: "", klasifikasiAkunId: targetId })
    setModal({ type: "add-sub" })
  }
  const openEditSub = (sub: SubKlasifikasiType) => {
    setFormSub({ code: sub.code, name: sub.name, klasifikasiAkunId: sub.klasifikasiAkunId })
    setModal({ type: "edit-sub", data: sub })
  }
  const openAddDetail = async (subKlasifikasiAkunId?: string) => {
    const targetId = subKlasifikasiAkunId || ""
    let autoCode = ""
    if (targetId) {
      try { autoCode = await generateAkunDetailCode(targetId) } catch { }
    }
    setFormDetail({ code: autoCode, name: "", subKlasifikasiAkunId: targetId, bankAccountNumber: "" })
    setModal({ type: "add-detail" })
  }
  const openEditDetail = (acc: AkunDetailType) => {
    setFormDetail({ code: acc.code, name: acc.name, subKlasifikasiAkunId: acc.subKlasifikasiAkunId, bankAccountNumber: acc.bankAccountNumber || "" })
    setModal({ type: "edit-detail", data: acc })
  }

  // Auto-generate code when klasifikasi changes in sub form
  const handleSubKlasifikasiChange = async (klasifikasiAkunId: string) => {
    setFormSub(prev => ({ ...prev, klasifikasiAkunId }))
    if (klasifikasiAkunId) {
      try {
        const code = await generateSubKlasifikasiCode(klasifikasiAkunId)
        setFormSub(prev => ({ ...prev, klasifikasiAkunId, code }))
      } catch { }
    }
  }

  // Auto-generate code when sub changes in detail form
  const handleDetailSubChange = async (subKlasifikasiAkunId: string) => {
    setFormDetail(prev => ({ ...prev, subKlasifikasiAkunId }))
    if (subKlasifikasiAkunId) {
      try {
        const code = await generateAkunDetailCode(subKlasifikasiAkunId)
        setFormDetail(prev => ({ ...prev, subKlasifikasiAkunId, code }))
      } catch { }
    }
  }

  const handlePresetSelect = (preset: typeof KLASIFIKASI_PRESETS[0]) => {
    setFormCls({ code: preset.code, name: preset.name })
  }

  const handleSubmitCls = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (modal.type === "edit-cls") {
        await editKlasifikasiAkun(modal.data.id, formCls)
        setData(data.map(d => d.id === modal.data.id ? { ...d, ...formCls } : d))
      } else {
        const res = await tambahKlasifikasiAkun({ ...formCls, unitSekolahId: initialUnitId })
        setData([...data, { ...res, subKlasifikasiAkun: [] }].sort((a, b) => a.code.localeCompare(b.code)))
        setExpandedCls(new Set([...expandedCls, res.id]))
      }
      setModal({ type: null })
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }

  const handleSubmitSub = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (modal.type === "edit-sub") {
        await editSubKlasifikasiAkun(modal.data.id, { code: formSub.code, name: formSub.name })
        setData(data.map(d => ({
          ...d,
          subKlasifikasiAkun: d.subKlasifikasiAkun.map(s =>
            s.id === modal.data.id ? { ...s, code: formSub.code, name: formSub.name } : s
          )
        })))
      } else {
        const res = await tambahSubKlasifikasiAkun({ name: formSub.name, klasifikasiAkunId: formSub.klasifikasiAkunId, code: formSub.code || undefined })
        setData(data.map(d => d.id === formSub.klasifikasiAkunId
          ? { ...d, subKlasifikasiAkun: [...d.subKlasifikasiAkun, { ...res, akunDetail: [] }].sort((a, b) => a.code.localeCompare(b.code)) }
          : d
        ))
      }
      setModal({ type: null })
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }

  const handleSubmitDetail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (modal.type === "edit-detail") {
        await editAkunDetail(modal.data.id, { code: formDetail.code, name: formDetail.name, bankAccountNumber: formDetail.bankAccountNumber || undefined })
        setData(data.map(d => ({
          ...d,
          subKlasifikasiAkun: d.subKlasifikasiAkun.map(s => ({
            ...s,
            akunDetail: s.akunDetail.map(a =>
              a.id === modal.data.id ? { ...a, code: formDetail.code, name: formDetail.name, bankAccountNumber: formDetail.bankAccountNumber } : a
            )
          }))
        })))
      } else {
        const res = await tambahAkunDetail({ name: formDetail.name, subKlasifikasiAkunId: formDetail.subKlasifikasiAkunId, code: formDetail.code || undefined, bankAccountNumber: formDetail.bankAccountNumber || undefined })
        setData(data.map(d => ({
          ...d,
          subKlasifikasiAkun: d.subKlasifikasiAkun.map(s =>
            s.id === formDetail.subKlasifikasiAkunId
              ? { ...s, akunDetail: [...s.akunDetail, { ...res, subKlasifikasiAkunId: formDetail.subKlasifikasiAkunId }].sort((a, b) => a.code.localeCompare(b.code)) }
              : s
          )
        })))
      }
      setModal({ type: null })
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    setIsDeleting(true)
    try {
      if (deleteModal.type === "cls") {
        await hapusKlasifikasiAkun(deleteModal.id)
        setData(data.filter(d => d.id !== deleteModal.id))
      } else if (deleteModal.type === "sub") {
        await hapusSubKlasifikasiAkun(deleteModal.id)
        setData(data.map(d => ({ ...d, subKlasifikasiAkun: d.subKlasifikasiAkun.filter(s => s.id !== deleteModal.id) })))
      } else if (deleteModal.type === "detail") {
        await hapusAkunDetail(deleteModal.id)
        setData(data.map(d => ({ ...d, subKlasifikasiAkun: d.subKlasifikasiAkun.map(s => ({ ...s, akunDetail: s.akunDetail.filter(a => a.id !== deleteModal.id) })) })))
      }
      setDeleteModal(null)
    } catch (err: any) { alert("Gagal menghapus: " + err.message) }
    finally { setIsDeleting(false) }
  }

  const handleToggleAkun = async (acc: AkunDetailType) => {
    try {
      await toggleAkunDetail(acc.id, !acc.isActive)
      setData(data.map(d => ({ ...d, subKlasifikasiAkun: d.subKlasifikasiAkun.map(s => ({ ...s, akunDetail: s.akunDetail.map(a => a.id === acc.id ? { ...a, isActive: !a.isActive } : a) })) })))
    } catch (err: any) { alert(err.message) }
  }

  // Filter
  const filterMatch = (text: string) => text.toLowerCase().includes(searchTerm.toLowerCase())
  const filteredData = searchTerm
    ? data.map(cls => ({
      ...cls,
      subKlasifikasiAkun: cls.subKlasifikasiAkun.map(sub => ({
        ...sub,
        akunDetail: sub.akunDetail.filter(a => filterMatch(a.code) || filterMatch(a.name))
      })).filter(sub => filterMatch(sub.code) || filterMatch(sub.name) || sub.akunDetail.length > 0)
    })).filter(cls => filterMatch(cls.name) || filterMatch(cls.code) || cls.subKlasifikasiAkun.length > 0)
    : data

  return (
    <div>
      <ConfirmModal
        isOpen={!!deleteModal}
        title={`Hapus ${deleteModal?.type === 'cls' ? 'Klasifikasi' : deleteModal?.type === 'sub' ? 'Sub Klasifikasi' : 'Akun Detail'}`}
        message={`Hapus "${deleteModal?.name}"? Semua data turunan akan ikut terhapus.`}
        onCancel={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* === MODAL FORMS === */}
      {modal.type && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-main m-0">
                {modal.type === "add-cls" && "Tambah Klasifikasi Akun"}
                {modal.type === "edit-cls" && "Edit Klasifikasi Akun"}
                {modal.type === "add-sub" && "Tambah Sub Klasifikasi"}
                {modal.type === "edit-sub" && "Edit Sub Klasifikasi"}
                {modal.type === "add-detail" && "Tambah Akun Detail"}
                {modal.type === "edit-detail" && "Edit Akun Detail"}
              </h3>
              <button onClick={() => setModal({ type: null })} className="p-2 rounded-lg hover:bg-bg transition-colors"><X size={18} className="text-text-muted" /></button>
            </div>
            <div className="p-6">
              {/* Klasifikasi Form */}
              {(modal.type === "add-cls" || modal.type === "edit-cls") && (
                <form onSubmit={handleSubmitCls} className="flex flex-col gap-4">
                  {modal.type === "add-cls" && availablePresets.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-main">Pilih Klasifikasi (Standar SIA)</label>
                      <div className="grid grid-cols-1 gap-2">
                        {availablePresets.map(p => (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => handlePresetSelect(p)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${formCls.code === p.code ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/30 hover:bg-bg'}`}
                          >
                            <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0">{p.code}</span>
                            <div>
                              <p className="font-semibold text-text-main">{p.name}</p>
                              <p className="text-xs text-text-muted">{p.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      {availablePresets.length === 0 && (
                        <p className="text-sm text-text-muted italic">Semua klasifikasi standar sudah dibuat.</p>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-[80px_1fr] gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-text-main">Kode <span className="text-red-500">*</span></label>
                      <Input value={formCls.code} readOnly disabled required className="text-center font-bold text-lg bg-gray-100 cursor-not-allowed" maxLength={2} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-text-main">Nama Klasifikasi <span className="text-red-500">*</span></label>
                      <Input placeholder="Cth: HARTA" value={formCls.name} onChange={e => setFormCls({ ...formCls, name: e.target.value })} required />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end mt-2">
                    <Button type="button" variant="outline" onClick={() => setModal({ type: null })}>Batal</Button>
                    <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
                  </div>
                </form>
              )}

              {/* Sub Klasifikasi Form */}
              {(modal.type === "add-sub" || modal.type === "edit-sub") && (
                <form onSubmit={handleSubmitSub} className="flex flex-col gap-4">
                  {modal.type === "add-sub" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-text-main">Klasifikasi Induk <span className="text-red-500">*</span></label>
                      <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formSub.klasifikasiAkunId} onChange={e => handleSubKlasifikasiChange(e.target.value)} required>
                        <option value="">-- Pilih Klasifikasi --</option>
                        {data.map(d => <option key={d.id} value={d.id}>[{d.code}] {d.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-[140px_1fr] gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-text-main">Kode <span className="text-red-500">*</span></label>
                      <Input value={formSub.code} readOnly disabled required className="font-mono font-bold bg-gray-100 cursor-not-allowed" />
                      <p className="text-xs text-emerald-600 font-medium">🔒 Otomatis</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-text-main">Nama Sub Klasifikasi <span className="text-red-500">*</span></label>
                      <Input placeholder="Cth: KAS & BANK" value={formSub.name} onChange={e => setFormSub({ ...formSub, name: e.target.value })} required autoFocus />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end mt-2">
                    <Button type="button" variant="outline" onClick={() => setModal({ type: null })}>Batal</Button>
                    <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
                  </div>
                </form>
              )}

              {/* Akun Detail Form */}
              {(modal.type === "add-detail" || modal.type === "edit-detail") && (
                <form onSubmit={handleSubmitDetail} className="flex flex-col gap-4">
                  {modal.type === "add-detail" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-text-main">Sub Klasifikasi <span className="text-red-500">*</span></label>
                      <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formDetail.subKlasifikasiAkunId} onChange={e => handleDetailSubChange(e.target.value)} required>
                        <option value="">-- Pilih Sub Klasifikasi --</option>
                        {data.flatMap(d => d.subKlasifikasiAkun.map(s => ({ ...s, clsName: d.name }))).map(s => (
                          <option key={s.id} value={s.id}>[{s.code}] {s.name} — {s.clsName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-[140px_1fr] gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-text-main">Kode <span className="text-red-500">*</span></label>
                      <Input value={formDetail.code} readOnly disabled required className="font-mono font-bold bg-gray-100 cursor-not-allowed" />
                      <p className="text-xs text-emerald-600 font-medium">🔒 Otomatis</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-text-main">Nama Akun <span className="text-red-500">*</span></label>
                      <Input placeholder="Cth: Kas Kecil Tunai" value={formDetail.name} onChange={e => setFormDetail({ ...formDetail, name: e.target.value })} required autoFocus />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main">No. Rekening Bank (Opsional)</label>
                    <Input placeholder="Cth: 1234567890" value={formDetail.bankAccountNumber} onChange={e => setFormDetail({ ...formDetail, bankAccountNumber: e.target.value })} />
                  </div>
                  <div className="flex gap-3 justify-end mt-2">
                    <Button type="button" variant="outline" onClick={() => setModal({ type: null })}>Batal</Button>
                    <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-700 font-medium mb-1">Klasifikasi</p>
          <p className="text-2xl font-bold text-emerald-700">{data.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium mb-1">Sub Klasifikasi</p>
          <p className="text-2xl font-bold text-blue-700">{totalSub}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-700 font-medium mb-1">Total Akun</p>
          <p className="text-2xl font-bold text-purple-700">{totalAkun}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 font-medium mb-1">Akun Aktif</p>
          <p className="text-2xl font-bold text-amber-700">{totalAktif} <span className="text-sm font-normal">/ {totalAkun}</span></p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Cari kode atau nama akun..." className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-text-main" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAddCls} className="text-sm"><Plus size={14} className="mr-1.5" /> Klasifikasi</Button>
          <Button variant="outline" onClick={() => openAddSub()} className="text-sm"><Plus size={14} className="mr-1.5" /> Sub Klasifikasi</Button>
          <Button variant="outline" onClick={() => openAddDetail()} className="text-sm"><Plus size={14} className="mr-1.5" /> Akun Detail</Button>
        </div>
      </div>

      {/* Tree View */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted font-medium">{searchTerm ? "Tidak ada akun yang cocok." : "Belum ada data Chart of Accounts."}</p>
            {!searchTerm && <p className="text-sm text-text-muted mt-1">Mulai dengan membuat Klasifikasi Utama (1=HARTA, 2=KEWAJIBAN, dst)</p>}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredData.map(cls => (
              <div key={cls.id}>
                {/* Klasifikasi Row */}
                <div className="flex items-center gap-2 px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                  <button onClick={() => toggleCls(cls.id)} className="p-1 rounded hover:bg-bg transition-colors">
                    {expandedCls.has(cls.id) ? <ChevronDown size={18} className="text-text-muted" /> : <ChevronRight size={18} className="text-text-muted" />}
                  </button>
                  <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary font-bold text-base flex items-center justify-center shrink-0">{cls.code}</span>
                  <FolderOpen size={20} className="text-albas-green shrink-0" />
                  <span className="font-bold text-lg text-text-main flex-1">{cls.name}</span>
                  <span className="text-xs text-text-muted bg-bg px-2 py-1 rounded-lg mr-2">{cls.subKlasifikasiAkun?.length || 0} sub</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openAddSub(cls.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="Tambah Sub"><Plus size={14} /></button>
                    <button onClick={() => openEditCls(cls)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteModal({ type: "cls", id: cls.id, name: cls.name })} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Sub Klasifikasi */}
                {expandedCls.has(cls.id) && cls.subKlasifikasiAkun?.map(sub => (
                  <div key={sub.id}>
                    <div className="flex items-center gap-2 pl-14 pr-6 py-3 hover:bg-gray-50/50 transition-colors group border-t border-border/50">
                      <button onClick={() => toggleSub(sub.id)} className="p-1 rounded hover:bg-bg transition-colors">
                        {expandedSub.has(sub.id) || searchTerm ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
                      </button>
                      <Folder size={16} className="text-blue-500 shrink-0" />
                      <span className="font-mono text-sm text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">{sub.code}</span>
                      <span className="font-semibold text-text-main flex-1">{sub.name}</span>
                      <span className="text-xs text-text-muted bg-bg px-2 py-1 rounded-lg mr-2">{sub.akunDetail?.length || 0} akun</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openAddDetail(sub.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="Tambah Akun"><Plus size={14} /></button>
                        <button onClick={() => openEditSub(sub)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteModal({ type: "sub", id: sub.id, name: `[${sub.code}] ${sub.name}` })} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* Akun Detail */}
                    {(expandedSub.has(sub.id) || searchTerm) && sub.akunDetail?.map(acc => (
                      <div key={acc.id} className={`flex items-center gap-3 pl-24 pr-6 py-2.5 hover:bg-gray-50/50 transition-colors group border-t border-border/30 ${!acc.isActive ? 'opacity-50' : ''}`}>
                        <FileText size={14} className="text-text-muted shrink-0" />
                        <span className="font-mono text-sm text-text-muted font-medium w-28 shrink-0">{acc.code}</span>
                        <span className={`text-text-main flex-1 ${!acc.isActive ? 'line-through' : ''}`}>{acc.name}</span>
                        {acc.bankAccountNumber && <span className="text-xs text-text-muted bg-bg px-2 py-0.5 rounded-lg">Rek: {acc.bankAccountNumber}</span>}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${acc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{acc.isActive ? "Aktif" : "Nonaktif"}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleToggleAkun(acc)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title={acc.isActive ? "Nonaktifkan" : "Aktifkan"}>{acc.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}</button>
                          <button onClick={() => openEditDetail(acc)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteModal({ type: "detail", id: acc.id, name: `[${acc.code}] ${acc.name}` })} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}

                    {(expandedSub.has(sub.id) || searchTerm) && (!sub.akunDetail || sub.akunDetail.length === 0) && (
                      <div className="pl-24 pr-6 py-3 text-sm text-text-muted italic border-t border-border/30">
                        Belum ada akun detail. <button onClick={() => openAddDetail(sub.id)} className="ml-1 text-primary font-semibold hover:underline">+ Tambah</button>
                      </div>
                    )}
                  </div>
                ))}

                {expandedCls.has(cls.id) && (!cls.subKlasifikasiAkun || cls.subKlasifikasiAkun.length === 0) && (
                  <div className="pl-14 pr-6 py-3 text-sm text-text-muted italic border-t border-border/50">
                    Belum ada sub klasifikasi. <button onClick={() => openAddSub(cls.id)} className="ml-1 text-primary font-semibold hover:underline">+ Tambah</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
